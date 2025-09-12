import express from 'express';
import cors from 'cors';
import multer from "multer";
import OpenAI, { toFile } from "openai";
import dotenv from "dotenv";
import { google } from "googleapis";
dotenv.config({ path: ".env.local" })

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors({
    origin: "http://localhost:5173", 
    credentials: true,               
  }));

app.use(express.json());

app.post('/api/export', async (req, res) => {
    const rawAuth = req.headers.authorization;
    const {events} = req.body;

    if(events.length === 0) return res.status(200).json({message: "No events to export."})
    
    //get temp auth code from header
    const auth = rawAuth?.split(" ")[1]; 

    if(!auth) return res.status(401).json({message: "No authorization code provided."});

    try{
        if (auth && typeof auth === "string") {
            //exchange temp code for a temp access token to write to the user's calendar
            const response = await fetch(
              "https://oauth2.googleapis.com/token",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  code: auth,
                  client_id: process.env.GOOGLE_CLIENT_ID!,
                  client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                  redirect_uri: process.env.REDIRECT_URI!,
                  grant_type: "authorization_code",
                }),
              }
            );
            const {access_token} = await response.json();

            if(!access_token) throw new Error("Failed to get access token");

              const oauth2Client = new google.auth.OAuth2();
                  oauth2Client.setCredentials({ access_token: access_token });

              const calendar = google.calendar({
                version: "v3",
                auth: oauth2Client,
              });

              const newCalendar = {
                summary: "Law Bandit Syllabus Calendar", 
                description: "Imported from Law Bandit"
              }

              //insert the new calendar into the user's google calendar
              // const createdCalendar = await calendar.calendars.insert({
              //   requestBody: newCalendar
              // });

              console.log("acces token: ", access_token)

              const createResp = await fetch("https://www.googleapis.com/calendar/v3/calendars", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${access_token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  summary: "Law Bandit Syllabus Calendar", 
                  description: "Imported from Law Bandit"
                }),
              });

              //const data = await createResp.json();
              const text = await createResp.text(); // <-- read the server’s reason
              console.error("Create calendar failed:", createResp.status, text);
              console.log("response: ", createResp)
              //const calendarId = data.id;
              const calendarId = null;

              if(!calendarId) throw new Error("Failed to create calendar");

              //insert each event from the evnets array into the google calendar

              


            
        }

    } catch(error){
        console.error("Google Export Error:", error);
        return res.status(400).json({message: "Error exporting events to Google Calendar."});
    }

    res.status(201).json({message: "Successfully exported events to Google Calendar."});
})

const upload = multer({ storage: multer.memoryStorage() });

app.post("/api/upload", upload.single("file"), async (req, res) => {
  console.log("fields:", req.body); // any extra form fields
  console.log("file info:", req.file); // metadata
  console.log("buffer length:", req.file?.buffer.length); // raw file data


  try{
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const guessedTZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";

    const systemPrompt =
        "You are an extraction engine that converts university course syllabi into STRICT JSON.\n\n" +
        "Follow these rules:\n" +
        "- Output ONLY valid JSON, no extra text.\n" +
        "- Use this exact structure:\n\n" +
        "{\n" +
        '  "title": "string",\n' +
        '  "allDay": true/false,\n' +
        '  "startDate": "YYYY-MM-DD",\n' +
        '  "endDate": "YYYY-MM-DD",\n' +
        '  "startTime": "HH:mm" (24 hour, optional),\n' +
        '  "endTime": "HH:mm" (24 hour, optional),\n' +
        `  "timezone": ${guessedTZ},\n` +
        '  "location": "string",\n' +
        '  "description": "string"\n' +
        "}\n\n" +
        "Constraints:\n" +
        "- Required fields: title, startDate, endDate, timezone, allDay, location, description.\n" +
        "- If no time is specified, the event is an all day event\n" +
        "- If data is missing don't hallucinate, leave the field value blank.\n" +
        "- Never return text outside the JSON .";

      const userPrompt = 
        "Parse the uploaded syllabus into a calendar-ready JSON of assignments.\n" +
        "Return ONLY a raw JSON array/object, no markdown, no backticks. \n\n"
        "Goals:\n" +
        "- Extract all assignments/quizzes/exams/projects/readings that have dates.\n" +
        "- Normalize dates to YYYY-MM-DD and times to HH:mm (24h) only when explicitly present.\n" +
        "- If no time is specified, the event IS an all day event\n" +
        "- If a time is specified, the event is NOT an all day event\n" +
        "- Prefer exact dates/times printed in the syllabus.\n" +
        "- Return ONLY the JSON (no prose) and ensure it matches the schema we provided on the server.\n\n" +
        "Notes for this syllabus:\n" +
        "- If the syllabus references an LMS (Canvas/Google Classroom) link for a submission, include it in the item’s description field if present.\n" +
        "- If a recurring pattern exists (e.g., “weekly reading due every Monday”), expand the instances only if the document provides concrete date mapping for the term; otherwise, include one representative item with a note.";
              
    const uploaded = await openai.files.create({
        // Convert Buffer to a File the SDK accepts
        file: await toFile(req.file.buffer, req.file.originalname, { type: req.file.mimetype }),
        purpose: "assistants" // generic file purpose accepted by Responses API
    });

    // Use the Responses API correctly
    const response = await openai.responses.create({
        model: "gpt-4o-mini",
        instructions: systemPrompt,
        input: [
            {
                role: "user",
                content: [
                    { type: "input_text", text: userPrompt },
                    { type: "input_file", file_id: uploaded.id },
                ],
            },
        ],

    });

    //console.log("response: ", response);
    // Extract the response content
    const content = response.output_text; // Adjusted to access the 'text' property instead of 'content'
    
    // Try to parse the JSON response
    let eventData;
    if (content) {
        try {
            eventData = JSON.parse(content);
        } catch (parseError) {
            console.error("Failed to parse JSON response:", parseError);
            return res.status(500).json({ error: "Failed to parse calendar data from file" });
        }
    } else {
        return res.status(500).json({ error: "Unexpected response format" });
    }

    //console.log("Extracted Event Data:", eventData);

    // Clean up the uploaded file
    await openai.files.delete(uploaded.id);
    
    res.status(201).json({events: eventData});

  } catch(error){
    console.error("Error processing file: ", error);
    res.status(400).json({ message: "Error processing file" });
  }
});

app.listen(5001, () => {
    console.log("server is up and running on port 5001")
})