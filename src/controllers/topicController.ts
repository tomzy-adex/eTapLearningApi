import { v2 as cloudinary } from "cloudinary";
import { Request, Response } from "express";
import { pool } from "../db";
import multer from "multer";
import path from "path";
import { Readable } from 'stream'; // To handle buffer stream


interface SelectedSubject {
  topicId: number;
  subjectId: number;
}

const upload = multer({ storage: multer.memoryStorage() });


const uploadVideoToStorage = (file: Express.Multer.File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'video' },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result?.secure_url) {
            resolve(result.secure_url); // Ensures that only a valid string is passed to resolve
          } else {
            reject(new Error('No secure_url returned from Cloudinary')); // Handle the case where secure_url is missing
          }
        }
      );
  
      // Convert buffer to readable stream and pipe it to Cloudinary
      const readableStream = new Readable();
      readableStream.push(file.buffer);
      readableStream.push(null); // Indicate the end of the stream
      readableStream.pipe(uploadStream);
    });
  };
  

const uploadVideoToStorage2 = async (
  file: Express.Multer.File
): Promise<string> => {
  try {
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "video" },
        (error, result) => {
          if (error) {
            reject(error); // Reject the promise if there's an error
          } else {
            resolve(result); // Resolve the promise with the result
          }
        }
      );
      // Pass the file buffer to the stream
      uploadStream.end(file.buffer); // Use the buffer to upload the video file
    });

    return result.secure_url; // Return the secure URL from Cloudinary response
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload video to Cloudinary");
  }
};

export const addTopicWithUploader = async (req: Request, res: Response) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }

  const videoFile = req.file; // Multer handles the file uploads

  try {
    let video_url: string | null = null; // Initialize video_url as null or empty

    if (videoFile) {
      // If a video file was uploaded, upload it to Cloudinary
      video_url = await uploadVideoToStorage(videoFile);
    }

    console.log({video_url});
    // return;
    
    // Ensure video_url is a valid string before inserting into the database
    const result = await pool.query(
      'INSERT INTO topics (subject_id, title, description, video_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.subjectId, title, description, video_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error uploading topic or video:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};




//   // Assume uploadVideoToStorage handles the video file and returns a URL after uploading
//   const uploadVideoToStorage = async (file: Express.Multer.File) => {
//     // Upload the file to cloud storage or local server and return the video URL
//     // Replace this with actual upload logic (e.g., AWS S3, Google Cloud, etc.)
//     return 'video_upload_url'; // Return the actual uploaded video URL
//   };

export const addTopic = async (req: Request, res: Response) => {
  const { subjectId } = req.params;
  const { title, description, video_url } = req.body;

  if (!title || !description) {
    return res
      .status(400)
      .json({ message: "Title and description are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO topics (subject_id, title, description, video_url) VALUES ($1, $2, $3, $4) RETURNING *",
      [subjectId, title, description, video_url]
    );

    console.error("Database insert result:", result);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Database insert error:", error);

    res.status(500).json({ message: "Server error", error: error });
  }
};

export const getAllTopicsBySubject = async (req: Request, res: Response) => {
  const { subjectId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM topics WHERE subject_id = $1",
      [subjectId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error, error });
  }
};

export const getTopicById = async (req: Request, res: Response) => {
  const { topicId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM topics WHERE id = $1", [
      topicId,
    ]);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const assignLessonToUser = async (req: Request, res: Response) => {
  const {
    learner_id,
    selectedSubjects,
  }: { learner_id: number; selectedSubjects: SelectedSubject[] } = req.body;

  if (!learner_id || !selectedSubjects || !selectedSubjects.length) {
    return res
      .status(400)
      .json({ message: "learner_id and selectedSubjects are required" });
  }

  try {
    const client = await pool.connect();

    const insertQuery = `
        INSERT INTO topic_completion (learner_id, topic_id, subject_id, completed, progress)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (learner_id, topic_id) DO NOTHING
        RETURNING *;
      `;

    const defaultCompleted = 0;
    const defaultProgress = 0;

    for (const subject of selectedSubjects) {
      const { topicId, subjectId } = subject;

      await client.query(insertQuery, [
        learner_id,
        topicId,
        subjectId,
        defaultCompleted,
        defaultProgress,
      ]);
    }

    client.release();

    return res.status(201).json({
      status: "success",
      message: "Topics assigned to learner successfully",
    });
  } catch (error) {
    console.error("Error inserting into topic_completions", error);
    return res.status(500).json({
      status: "error",
      message: "Server error while inserting topics for learner",
      error,
    });
  }
};

export const getUsersOfferingTopic = async (req: Request, res: Response) => {
  const topicId = parseInt(req.params.topic_id);

  if (!topicId) {
    return res.status(400).json({ message: "Invalid topic_id" });
  }

  try {
    const usersQuery = `
      SELECT l.id AS learner_id, l.name AS learner_name, l.email AS learner_email, 
             tc.progress, tc.completed, tc.subject_id, s.title AS subject_title,
             t.id AS topic_id, t.title AS topic_title
      FROM topic_completion tc
      JOIN learners l ON l.id = tc.learner_id
      JOIN subjects s ON s.id = tc.subject_id
      JOIN topics t ON t.id = tc.topic_id
      WHERE tc.topic_id = $1
      ORDER BY tc.progress DESC;
    `;

    const result = await pool.query(usersQuery, [topicId]);

    const usersOfferingTopic = result.rows.map((row) => ({
      learner_id: row.learner_id,
      learner_name: row.learner_name,
      learner_email: row.learner_email,
      progress: row.progress,
      completed: row.completed,
      subject: {
        subject_id: row.subject_id,
        subject_title: row.subject_title,
      },
      topic: {
        topic_id: row.topic_id,
        topic_title: row.topic_title,
      },
    }));

    return res.json(usersOfferingTopic);
  } catch (error) {
    console.error("Error fetching users offering topic:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

export const updateProgress = async (req: Request, res: Response) => {
  const { learnerId, topicId, progress } = req.body;

  if (!learnerId || !topicId || progress == null) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Update or insert the progress in topic_completion
    const result = await pool.query(
      `UPDATE topic_completion
         SET progress = $1, completed = $2
         WHERE learner_id = $3 AND topic_id = $4
         RETURNING *`,
      [progress, progress === 100, learnerId, topicId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "No topic_completion record found for learner and topic.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Progress updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// router.post('/topics/:topicId/complete', async (req, res) => {
//     const { learnerId } = req.body;
//     const { topicId } = req.params;

//     try {
//       await pool.query('INSERT INTO topic_completion (learner_id, topic_id, completed) VALUES ($1, $2, TRUE)', [learnerId, topicId]);
//       res.status(200).json({ message: 'Topic marked as completed' });
//     } catch (err) {
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   });

// router.get('/subjects/:subjectId/rankings', async (req, res) => {
//     const { subjectId } = req.params;

//     try {
//       const { rows } = await pool.query(`
//         SELECT l.name, COUNT(tc.topic_id) AS completed_topics
//         FROM learners l
//         JOIN topic_completion tc ON l.id = tc.learner_id
//         JOIN topics t ON tc.topic_id = t.id
//         WHERE t.subject_id = $1 AND tc.completed = TRUE
//         GROUP BY l.name
//         ORDER BY completed_topics DESC
//       `, [subjectId]);
//       res.json(rows);
//     } catch (err) {
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   });
