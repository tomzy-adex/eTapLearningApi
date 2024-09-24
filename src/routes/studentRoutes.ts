import express from 'express';
import { addStudent, getAllStudents } from '../controllers/studentController';

const router = express.Router();

router.post('/addStudent', addStudent);

router.get('/getAllStudents', getAllStudents);

export default router;
