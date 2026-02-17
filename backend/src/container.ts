
// DI wiring
import { PaymentController } from "./controllers/payment.controller";
import { RazorpayProvider } from "./providers/razorpay.provider";
import { EventRepository } from "./repositories/event.repo";
import { PaymentRepository } from "./repositories/payment.repo";
import { SubmissionsRepositories } from "./repositories/submission.repo";
import { PaymentService } from "./services/payment.service";

const paymentRepo = new PaymentRepository();
const eventRepo = new EventRepository();
const submissionRepo = new SubmissionsRepositories();
const Razorpay = new RazorpayProvider()

const paymentService = new PaymentService(paymentRepo, eventRepo, submissionRepo, Razorpay);


export const paymentController = new PaymentController(paymentService);