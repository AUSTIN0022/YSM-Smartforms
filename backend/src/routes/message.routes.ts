
import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { MessageService } from '../services/message.service';
import { contactRepository } from '../repositories/contact.repo';
import { MessageRepository } from '../repositories/message.repo';
import { EventRepository } from '../repositories/event.repo';
import { authMiddleware } from '../middlewares/auth.middleware';


const router = Router();


const contactRepo = new contactRepository();
const messageRepo = new MessageRepository();
const eventRepo = new EventRepository();
const messageService = new MessageService(messageRepo, contactRepo, eventRepo)
const controller = new MessageController(messageService);


router.get('/', authMiddleware, controller.getMessages);
router.post('/send', authMiddleware, controller.send);


export default router;