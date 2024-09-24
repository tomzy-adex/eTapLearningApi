import { Request, Response } from 'express';
import {pool} from '../db';

export const addSubjectOld = async (req: Request, res: Response) => {
    const { title, description } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO subjects (title, description) VALUES ($1, $2) RETURNING *',
            [title, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


export const addSubject = async (req: Request, res: Response) => {
    const { title, description } = req.body;
  
    // Check if the title or description is missing
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }
  
    try {
      const result = await pool.query(
        'INSERT INTO subjects (title, description) VALUES ($1, $2) RETURNING *',
        [title, description]
      );
  
      // Respond with the inserted row
      console.error('Database insert result:', result);
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      // Log the error for debugging
      console.error('Database insert error:', error);
  
      // Respond with a server error message
      res.status(500).json({ message: "Server error", error: error?.message });
    }
  };

export const getAllSubjects = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM subjects');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subjects', error });
    }
};

export const getSubjectsAndTopics = async (req: Request, res: Response) => {
    const learnerId = parseInt(req.params.learner_id);
  
    if (!learnerId) {
      return res.status(400).json({ message: 'Invalid learner_id' });
    }
  
    try {
      const subjectsQuery = `
        SELECT s.id AS subject_id, s.title AS subject_title, s.description AS subject_description,
               t.id AS topic_id, t.title AS topic_title, t.description AS topic_description, t.video_url,
               CASE WHEN tc.learner_id IS NOT NULL THEN 1 ELSE 0 END AS is_offering
        FROM subjects s
        LEFT JOIN topics t ON s.id = t.subject_id
        LEFT JOIN topic_completion tc ON tc.topic_id = t.id AND tc.learner_id = $1
        ORDER BY s.id, t.id;
      `;
  
      const result = await pool.query(subjectsQuery, [learnerId]);
  
      const subjects: any[] = [];
  
      result.rows.forEach((row) => {
        let subject = subjects.find((subj) => subj.id === row.subject_id);
  
        if (!subject) {
          subject = {
            id: row.subject_id,
            title: row.subject_title,
            description: row.subject_description,
            topics: [],
          };
          subjects.push(subject);
        }
  
        if (row.topic_id) {
          subject.topics.push({
            id: row.topic_id,
            title: row.topic_title,
            description: row.topic_description,
            video_url: row.video_url,
            isOffering: row.is_offering,
          });
        }
      });
  
      return res.json(subjects);
    } catch (error) {
      console.error('Error fetching subjects and topics:', error);
      return res.status(500).json({ message: 'Server error', error });
    }
  };


export const getSubjectsAndTopicsById = async (req: Request, res: Response) => {
  const learnerId = parseInt(req.params.learner_id);

  if (!learnerId) {
    return res.status(400).json({ message: 'Invalid learner_id' });
  }

  try {
    const subjectsAndTopicsQuery = `
      SELECT s.id AS subject_id, s.title AS subject_title, s.description AS subject_description,
             t.id AS topic_id, t.title AS topic_title, t.description AS topic_description, t.video_url, tc.progress
      FROM topic_completion tc
      JOIN topics t ON tc.topic_id = t.id
      JOIN subjects s ON tc.subject_id = s.id
      WHERE tc.learner_id = $1
      ORDER BY s.id, t.id;
    `;

    const result = await pool.query(subjectsAndTopicsQuery, [learnerId]);

    const subjects: any[] = [];

    result.rows.forEach((row) => {
      let subject = subjects.find((subj) => subj.id === row.subject_id);

      if (!subject) {
        subject = {
          id: row.subject_id,
          title: row.subject_title,
          description: row.subject_description,
          topics: [],
        };
        subjects.push(subject);
      }

      if (row.topic_id) {
        subject.topics.push({
          id: row.topic_id,
          title: row.topic_title,
          description: row.topic_description,
          video_url: row.video_url,
          progress: row.progress,
        });
      }
    });

    return res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects and topics:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};


// export const getAllSubjects = async (req: Request, res: Response) => {
//   try {
//     const result = await pool.query('SELECT * FROM subjects');
//     res.status(200).json(result.rows);
//   } catch (error) {
//     res.status(500).json({ error: 'Error fetching subjects' });
//   }
// };
