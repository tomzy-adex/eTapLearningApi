import express from 'express';
import {addSubject, getAllSubjects, getSubjectsAndTopics, getSubjectsAndTopicsById } from '../controllers/subjectController';

const router = express.Router();

router.get('/getAllSubjects', getAllSubjects);
router.get('/:learner_id', getSubjectsAndTopics);

router.post('/addSubject', addSubject);
router.get('/getOfferingLesson/:learner_id', getSubjectsAndTopicsById);

export default router;
