import { Module } from '@nestjs/common';
import { RelationFormatterService } from './relation-formatter.service';  // Import RelationFormatterService

@Module({
    providers: [RelationFormatterService],  // Đăng ký RelationFormatterService như một provider
    exports: [RelationFormatterService],    // Export nó để sử dụng trong các module khác
})
export class CommonModule { }
