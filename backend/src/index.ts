import express from 'express';
import cors from 'cors';
import multer from "multer";
import OpenAI, { toFile } from "openai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" })

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
//test

app.use(cors({
    origin: "http://localhost:5173", // your React dev server
    credentials: true,               // needed if you plan to use cookies/sessions
  }));

app.get('/api', (req, res) => {
    console.log("hello world;lkja;ldsj")
    res.send("hello from backend")
})

const upload = multer({ storage: multer.memoryStorage() });

app.post("/api/upload", upload.single("file"), async (req, res) => {
  console.log("fields:", req.body); // any extra form fields
  console.log("file info:", req.file); // metadata
  console.log("buffer length:", req.file?.buffer.length); // raw file data

  const eventSchema = {
    name: "Event",
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        allDay: { type: "boolean" },
        startDate: { type: "string", description: "YYYY-MM-DD" },
        endDate: { type: "string", description: "YYYY-MM-DD" },
        startTime: { type: "string", description: "HH:mm (24h, optional)" },
        endTime: { type: "string", description: "HH:mm (24h, optional)" },
        location: { type: "string" },
        description: { type: "string" },
      },
      required: ["title", "startDate", "endDate", "allDay"],
      additionalProperties: false
    },
    strict: true
  };

  try{
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

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
  '  "startTime": "HH:mm" (optional),\n' +
  '  "endTime": "HH:mm" (optional),\n' +
  '  "location": "string" (optional),\n' +
  '  "description": "string" (optional)\n' +
  "}\n\n" +
  "Constraints:\n" +
  "- Required fields: title, startDate, endDate, allDay.\n" +
  "- If data is missing, omit the field unless required.\n" +
  "- Never return text outside the JSON .";

const userPrompt = 
  "Parse the uploaded syllabus into a calendar-ready JSON of assignments.\n\n" +
  "Goals:\n" +
  "- Extract all assignments/quizzes/exams/projects/readings that have dates.\n" +
  "- Normalize dates to YYYY-MM-DD and times to HH:mm (24h) only when explicitly present.\n" +
  "- Prefer exact dates/times printed in the syllabus.\n" +
  "- Return ONLY the JSON (no prose) and ensure it matches the schema we provided on the server.\n\n" +
  "Notes for this syllabus:\n" +
  "- If the syllabus references an LMS (Canvas/Google Classroom) link for a submission, include it in the item’s link field if present.\n" +
  "- If a recurring pattern exists (e.g., “weekly reading due every Monday”), expand the instances only if the document provides concrete date mapping for the term; otherwise, include one representative item with a note.";
        
    const uploaded = await openai.files.create({
        // Convert Buffer to a File the SDK accepts
        file: await toFile(req.file.buffer, req.file.originalname, { type: req.file.mimetype }),
        purpose: "assistants" // generic file purpose accepted by Responses API
    });

    console.log("uploaded ")

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

    console.log("response: ", response);
    // Extract the response content
    const content = response.output[0]?.content;
    
    // Try to parse the JSON response
    let eventData;
    if (content && content.type === 'text') {
        try {
            eventData = JSON.parse(content.text);
        } catch (parseError) {
            console.error("Failed to parse JSON response:", parseError);
            return res.status(500).json({ error: "Failed to parse calendar data from file" });
        }
    } else {
        return res.status(500).json({ error: "Unexpected response format" });
    }

    console.log("Extracted Event Data:", eventData);

    // Clean up the uploaded file
    await openai.files.del(uploaded.id);

  } catch(error){
    console.error("Error processing file: ", error);
    res.status(400).json({ message: "Error processing file" });
  }


  res.status(200).json({ message: "File uploaded successfully" });
});

app.listen(5001, () => {
    console.log("server is up and running on port 5001")
})