import { Request, Response } from 'express';
import {pool} from '../db';

// export const addStudent = async (req: Request, res: Response) => {
//     const { name, email } = req.body;
//     try {
//         const result = await pool.query(
//             'INSERT INTO students (name, email) VALUES ($1, $2) RETURNING *',
//             [name, email]
//         );
//         res.status(201).json(result.rows[0]);
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//     }
// };

export const addStudent = async (req: Request, res: Response) => {
    const { name, email } = req.body;
  
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and Email are required' });
    }
  
    try {
      const result = await pool.query(
        'INSERT INTO learners (name, email) VALUES ($1, $2) RETURNING *',
        [name, email]
      );
  
      console.error('Database insert result:', result);
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Database insert error:', error);
        res.status(500).json({ message: "Server error", error: error?.message });
    }
  };

export const getAllStudents = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM learners');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
