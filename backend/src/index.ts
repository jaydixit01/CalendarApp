import express from 'express';
import cors from 'cors';
import multer from "multer";
import OpenAI, { toFile } from "openai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" })

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors({
    origin: "http://localhost:5173", 
    credentials: true,               
  }));

app.post('/api/export', (req, res) => {
    const rawAuth = req.headers.authorization;
    const auth = rawAuth?.split(" ")[1]; 

    if(!auth) return res.status(401).json({message: "No authorization code provided."});

    try{

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