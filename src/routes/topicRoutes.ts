import express from 'express';
import { addTopic, addTopicWithUploader, getAllTopicsBySubject, getTopicById, assignLessonToUser, getUsersOfferingTopic, updateProgress } from '../controllers/topicController';
import multer from 'multer';

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post('/:subjectId/addTopicWithUploader', upload.single('video'), addTopicWithUploader);
router.post('/:subjectId/topics', addTopic);
// router.post('/:subjectId/addTopicWithUploader', addTopicWithUploader);
router.post('/assignLessonToUser', assignLessonToUser);
router.post('/updateProgress', updateProgress);

router.get('/:subjectId/topics', getAllTopicsBySubject);
router.get('/:topic_id/users', getUsersOfferingTopic);


router.get('/topics/:topicId', getTopicById);

export default router;
