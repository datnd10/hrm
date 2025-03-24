import { Injectable } from '@nestjs/common';

@Injectable()
export class RelationFormatterService {
    /**
     * Định dạng các trường từ các relations cụ thể.
     * @param entity - Đối tượng chính (ví dụ: Branch, User, etc.).
     * @param relationFields - Object chứa các relations và danh sách các fields cần lấy từ mỗi relation.
     *    Ví dụ: { createdBy: ['id', 'name', 'email'], updatedBy: ['id', 'name'], roles: ['id', 'roleName'] }
     */
    formatRelations(entity: any, relationFields: Record<string, string[]>) {
        const formattedEntity = { ...entity };

        // Lặp qua từng relation và chỉ lấy các fields được chỉ định
        for (const relation in relationFields) {
            if (formattedEntity[relation]) {
                formattedEntity[relation] = this.pickFields(formattedEntity[relation], relationFields[relation]);
            }
        }

        return formattedEntity;
    }

    /**
     * Hàm này giúp lấy ra chỉ những trường cần thiết từ một đối tượng.
     * @param obj - Đối tượng cần lấy fields (ví dụ: createdBy, updatedBy).
     * @param fields - Danh sách các fields cần lấy từ đối tượng.
     */
    private pickFields(obj: any, fields: string[]) {
        return fields.reduce((acc, field) => {
            if (obj[field] !== undefined) {
                acc[field] = obj[field];
            }
            return acc;
        }, {});
    }
}
