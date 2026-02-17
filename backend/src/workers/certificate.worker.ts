import { Worker } from 'bullmq'
import { CertificateWorkerService } from './certificate.worker.service';
import { workerRegistry } from './worker.registry';
import { FileService } from '../services/file.service';
import { CertificateRepository } from '../repositories/certificate.repo';
import { CertificateGeneratorService } from '../services/certificate-generator.service';
import { FileRepository } from '../repositories/file.repo';
import {  getStorageProvider } from './../providers/storage.provider';

export class CertifcateWorker {

    name = "certificate-worker";

    constructor(
        private workerService: CertificateWorkerService
    ) {}


    start() {
        new Worker(
            "certificate-queue", 
            async (job) => {
                await this.workerService.generate(job.data);
            }
        );
    }
}


const storgageProvider = getStorageProvider();
const certRepisitory = new CertificateRepository();
const fileService = new FileService(new FileRepository(), storgageProvider);
const workerService  =  new CertificateWorkerService(certRepisitory, fileService, new CertificateGeneratorService());
const certifcateWorker = new CertifcateWorker(workerService);

workerRegistry.register(certifcateWorker)