import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import * as xl from 'excel4node';
import * as XLSX from 'xlsx';
import { headerStyle, numberStyle, style, titleStyle, workSheetOptions } from '@shared/constants/excelConstants'
import { ExpenseCategory } from '@shared/constants/enum';
@Injectable()
export class ExcelService {
  constructor(@InjectQueue('excel-queue') private readonly excelQueue: Queue) { }

  extractMonthYear(text: string): string | null {
    const match = text.match(/\d{2}-\d{4}/);
    return match ? match[0] : null;
  }

  async exportSalaryExcel(data: any, headers: any, title: string, entityMapping: any): Promise<Buffer> {
    const monthYear = this.extractMonthYear(title);
    const workbook = new xl.Workbook();
    const worksheet = workbook.addWorksheet('Bảng Tính Lương', workSheetOptions);

    worksheet.cell(1, 6).string(title).style(headerStyle);
    worksheet.row(1).setHeight(30);
    worksheet.cell(1, 6, 1, 10, true);

    worksheet.cell(2, 1).string("⚠️ Vui lòng không chỉnh sửa các ô Nhân viên, Chi nhánh, Phòng ban, Chức vụ").style({
      font: { bold: true, color: '#FF0000', fontSize: 14, name: 'Times New Roman' },
    });

    const finalHeaderNames = ["Tiền trước thuế", "Thuế", "Tiền sau thuế", "Ngày thực chi", "Trạng thái"];

    let colIndex = 1;
    headers
      .filter(header => !finalHeaderNames.includes(header.name) && header.isPrice === 0)
      .forEach(header => {
        worksheet.cell(3, colIndex).string(header.name).style(headerStyle);
        colIndex++;
      });
    const salaryHeaders = headers.filter(header => header.type === 'SALARY');
    const deductionHeaders = headers.filter(header => header.type === 'DEDUCTION');

    if (salaryHeaders.length > 0) {
      const salaryStartCol = colIndex;

      salaryHeaders.forEach(header => {
        const headerDetails =
          header.formulaType === 'BASE_SALARY'
            ? ['Đơn giá', 'Số lượng', 'Ngày công chuẩn']
            : header.formulaType === 'FIXED_COST' || header.formulaType === 'VARIABLE_COST'
              ? ['Đơn giá', 'Số lượng']
              : ['Số lượng'];

        const mergeStart = colIndex;
        headerDetails.forEach((detail, detailIndex) => {
          worksheet.cell(5, colIndex + detailIndex).string(detail).style(headerStyle);
        });

        // Merge tiêu đề loại chi phí (e.g., "Lương", "Hỗ trợ ăn trưa")
        worksheet.cell(4, mergeStart, 4, colIndex + headerDetails.length - 1, true).string(`${header.name} (${header.id})`).style(headerStyle);
        colIndex += headerDetails.length;
      });

      // Merge tiêu đề chính "Lương"
      worksheet.cell(3, salaryStartCol, 3, colIndex - 1, true).string('Lương').style(headerStyle);
    }

    if (deductionHeaders.length > 0) {
      const deductionStartCol = colIndex;

      deductionHeaders.forEach(header => {
        const headerDetails =
          header.formulaType === 'BASE_SALARY'
            ? ['Đơn giá', 'Số lượng', 'Ngày công chuẩn']
            : header.formulaType === 'FIXED_COST' || header.formulaType === 'VARIABLE_COST'
              ? ['Đơn giá', 'Số lượng']
              : ['Số lượng'];

        const mergeStart = colIndex;
        headerDetails.forEach((detail, detailIndex) => {
          worksheet.cell(5, colIndex + detailIndex).string(detail).style(headerStyle);
        });

        // Merge tiêu đề loại chi phí (e.g., "Lương giảm trừ", "Tiền giảm trừ")
        worksheet.cell(4, mergeStart, 4, colIndex + headerDetails.length - 1, true).string(`${header.name} (${header.id})`).style(headerStyle);
        colIndex += headerDetails.length;
      });

      // Merge tiêu đề chính "Giảm trừ"
      worksheet.cell(3, deductionStartCol, 3, colIndex - 1, true).string('Giảm trừ').style(headerStyle);
    }

    headers
      .filter(header => finalHeaderNames.includes(header.name) && header.isPrice === 0)
      .forEach(header => {
        worksheet.cell(3, colIndex).string(header.name).style(headerStyle);
        colIndex++;
      });

    for (let i = 1; i < colIndex; i++) {
      worksheet.column(i).setWidth(i <= 4 ? 25 : i >= colIndex - 5 ? 20 : 20);
    }

    let rowIndex = 6;

    data.forEach((entity) => {
      // Điền thông tin cơ bản
      worksheet.cell(rowIndex, 1).string(entityMapping.employee(entity)).style(style);
      worksheet.cell(rowIndex, 2).string(entityMapping.branch(entity)).style(style);
      worksheet.cell(rowIndex, 3).string(entityMapping.department(entity)).style(style);
      worksheet.cell(rowIndex, 4).string(entityMapping.position(entity)).style(style);

      let currentCol = 6; // Bắt đầu sau các cột thông tin cơ bản

      // Nếu có expenseItems
      if (entity.expenseItems) {
        worksheet.cell(rowIndex, 5).string(entityMapping.billingCycle(entity)).style(style);
        headers.forEach((header) => {
          if (header.isPrice === 1) {
            const expenseItemValues = entityMapping.expenseItems(entity, header.id) || {};
            const price = expenseItemValues.price || 0;
            const quantity = expenseItemValues.quantity || 0;
            const baseQuantity = expenseItemValues.baseQuantity || 0;

            if (header.formulaType === 'BASE_SALARY') {
              worksheet.cell(rowIndex, currentCol).number(price).style(numberStyle); // Đơn giá
              worksheet.cell(rowIndex, currentCol + 1).number(quantity).style(style); // Số lượng
              worksheet.cell(rowIndex, currentCol + 2).number(baseQuantity).style(style); // Ngày công chuẩn
              currentCol += 3;
            } else if (header.formulaType === 'FIXED_COST') {
              worksheet.cell(rowIndex, currentCol).number(price).style(numberStyle); // Đơn giá
              worksheet.cell(rowIndex, currentCol + 1).number(quantity).style(style); // Số lượng
              currentCol += 2;
            } else if (header.formulaType === 'TIERED_COST') {
              worksheet.cell(rowIndex, currentCol).number(quantity).style(style); // Số lượng
              currentCol += 1;
            } else {
              worksheet.cell(rowIndex, currentCol).number(price).style(numberStyle); // Đơn giá
              worksheet.cell(rowIndex, currentCol + 1).number(quantity).style(style); // Số lượng
              currentCol += 2;
            }
          }
        });
        worksheet.cell(rowIndex, currentCol).number(entityMapping.preTaxAmount(entity)).style(numberStyle);
        worksheet.cell(rowIndex, currentCol + 1).string(entityMapping.taxRate(entity)).style(style);
        worksheet.cell(rowIndex, currentCol + 2).number(entityMapping.totalAmount(entity)).style(numberStyle);
        worksheet.cell(rowIndex, currentCol + 3).string(entityMapping.expenseDate(entity)).style(style);
        worksheet.cell(rowIndex, currentCol + 4).string(entityMapping.status(entity)).style(style);
      } else {
        worksheet.cell(rowIndex, 5).string(monthYear).style(style);
        headers.forEach((header) => {
          if (header.isPrice === 1) {
            if (header.formulaType === 'BASE_SALARY') {
              worksheet.cell(rowIndex, currentCol).number(entity.salary || 0).style(numberStyle); // Đơn giá
              worksheet.cell(rowIndex, currentCol + 1).style(style); // Số lượng (trống)
              worksheet.cell(rowIndex, currentCol + 2).style(style); // Ngày công chuẩn (trống)
              currentCol += 3;
            } else if (header.formulaType === 'FIXED_COST') {
              worksheet.cell(rowIndex, currentCol).number(Number(header.basePrice) || 0).style(numberStyle); // Đơn giá
              worksheet.cell(rowIndex, currentCol + 1).style(style); // Số lượng (trống)
              currentCol += 2;
            } else if (header.formulaType === 'TIERED_COST') {
              worksheet.cell(rowIndex, currentCol).style(style); // Số lượng (trống)
              currentCol += 1;
            } else if (header.formulaType === 'VARIABLE_COST') {
              worksheet.cell(rowIndex, currentCol).style(numberStyle); // Đơn giá (trống)
              worksheet.cell(rowIndex, currentCol + 1).style(style); // Số lượng (trống)
              currentCol += 2;
            }
          }
        });
      }

      // Di chuyển đến hàng tiếp theo
      rowIndex++;
    });


    return new Promise((resolve, reject) => {
      workbook.writeToBuffer()
        .then((buffer) => resolve(buffer))
        .catch((error) => reject(error));
    });
  }




  async importSalaryExcel(buffer: Buffer, headers: any[]): Promise<any[]> {
    // Đọc tệp Excel từ buffer
    console.log("reading excel file...");

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]; // Chọn sheet đầu tiên
    const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const fixedHeaders = ["Nhân viên", "Chi nhánh", "Phòng ban", "Chức vụ", "Kỳ thanh toán"];
    const mainHeaders = sheetData[2]; // Dòng tiêu đề chính (dòng 3)
    const subHeaders = sheetData[4]; // Dòng tiêu đề con (dòng 4)

    for (let i = 0; i < fixedHeaders.length; i++) {
      if (mainHeaders[i]?.trim() !== fixedHeaders[i]) {
        throw new Error(
          `File Excel không đúng định dạng. Thiếu hoặc sai tiêu đề cố định: "${fixedHeaders[i]}" tại cột ${i + 1}`
        );
      }
    }

    console.log("Fixed headers validated successfully!");

    const expectedMainHeaders: string[] = [];
    const expectedSubHeaders: string[] = [];

    headers.forEach((header) => {
      if (header.isPrice === 1) {
        if (header.formulaType === 'BASE_SALARY') {
          expectedMainHeaders.push(header.name); // Thêm tiêu đề chính
          expectedSubHeaders.push("Đơn giá", "Số lượng", "Ngày công chuẩn"); // Thêm các tiêu đề con
        } else if (header.formulaType === 'FIXED_COST') {
          expectedMainHeaders.push(header.name); // Thêm tiêu đề chính
          expectedSubHeaders.push("Đơn giá", "Số lượng"); // Thêm các tiêu đề con
        } else if (header.formulaType === 'TIERED_COST') {
          expectedMainHeaders.push(header.name); // Thêm tiêu đề chính
          expectedSubHeaders.push("Số lượng"); // Thêm các tiêu đề con
        } else {
          expectedMainHeaders.push(header.name); // Thêm tiêu đề chính
          expectedSubHeaders.push("Đơn giá", "Số lượng"); // Thêm các tiêu đề con
        }
      }
    });


    // Kiểm tra tiêu đề con
    let subHeaderIndex = 5; // Cột bắt đầu chứa tiêu đề con
    for (const header of headers) {
      if (header.isPrice === 1) {
        const subHeadersForHeader = [];
        if (header.formulaType === 'BASE_SALARY') {
          subHeadersForHeader.push("Đơn giá", "Số lượng", "Ngày công chuẩn");
        } else if (header.formulaType === 'FIXED_COST') {
          subHeadersForHeader.push("Đơn giá", "Số lượng");
        } else if (header.formulaType === 'TIERED_COST') {
          subHeadersForHeader.push("Số lượng");
        } else {
          subHeadersForHeader.push("Đơn giá", "Số lượng");
        }

        for (const subHeader of subHeadersForHeader) {
          if (subHeaders[subHeaderIndex] !== subHeader) {
            console.error(`File Excel không đúng định dạng. Tiêu đề con không đúng tại cột ${subHeaderIndex + 1}`);
            throw new Error(`File Excel không đúng định dạng. Tiêu đề con không đúng tại cột ${subHeaderIndex + 1}`);
          }
          subHeaderIndex++;
        }
      }
    }

    console.log("File Excel đúng định dạng. Tiến hành đọc dữ liệu...");


    const data = [];
    const expenseItemsStartCol = 5; // Cột đầu tiên chứa chi tiêu

    // Bắt đầu từ hàng 6, lặp qua dữ liệu để xử lý
    for (let rowIndex = 5; rowIndex < sheetData.length; rowIndex++) {
      const row: any = sheetData[rowIndex];
      if (!row || row.every(cell => cell === null || cell === undefined || cell.toString().trim() === '')) continue;

      const employeeMatch = row[0]?.match(/\(ID: (\d+)\)/);
      const branchMatch = row[1]?.match(/\(ID: (\d+)\)/);
      const monthYear = row[4]?.trim();
      const employeeId = employeeMatch ? parseInt(employeeMatch[1], 10) : null;
      const branchId = branchMatch ? parseInt(branchMatch[1], 10) : null;

      const expenseItems = [];
      let headerIndex = expenseItemsStartCol;

      console.log(headers);


      // Xử lý các mục chi tiêu theo header
      headers.forEach((header) => {
        if (header.isPrice === 1) {
          let expenseItem = {
            expenseTypeId: header.id,
            type: header.type,
            formulaType: header.formulaType,
            price: 0,
            quantity: 0,
            baseQuantity: 0,
          };
          // Determine how to map columns based on the formula type
          if (header.formulaType === 'BASE_SALARY') {
            expenseItem.price = row[headerIndex] || 0;
            expenseItem.quantity = row[headerIndex + 1] || 0;
            expenseItem.baseQuantity = row[headerIndex + 2] || 0;
            headerIndex += 3; // Move to the next set of columns
          } else if (header.formulaType === 'FIXED_COST') {
            expenseItem.price = row[headerIndex] || 0;
            expenseItem.quantity = row[headerIndex + 1] || 0;
            headerIndex += 2; // Move to the next set of columns
          } else if (header.formulaType === 'TIERED_COST') {
            expenseItem.quantity = row[headerIndex] || 0; // Only quantity is relevant
            headerIndex += 1; // Move to the next column
          } else {
            // Default to 'Đơn giá' and 'Số lượng'
            expenseItem.price = row[headerIndex] || 0;
            expenseItem.quantity = row[headerIndex + 1] || 0;
            headerIndex += 2; // Move to the next set of columns
          }

          expenseItems.push(expenseItem); // Add validated expenseItem to the array
        }
      });


      if (expenseItems.length > 0 || employeeId || monthYear || branchId !== null) {
        data.push({
          employeeId: employeeId,
          expenseName: `Trả lương tháng ${monthYear}`,
          billingCycle: monthYear,
          branchId: branchId,
          taxRate: 10,
          expenseItems,
        });
      }
    }
    console.log("reading excel file done...");

    return data;
  }


  async exportExpenseExcel(data: any, headers: any, title: string, entityMapping: any, branches: []): Promise<Buffer> {
    const monthYear = this.extractMonthYear(title);
    const workbook = new xl.Workbook();
    const worksheet = workbook.addWorksheet('Bảng chi phí', workSheetOptions);

    worksheet.cell(1, 6).string(title).style(headerStyle);
    worksheet.row(1).setHeight(30);
    worksheet.cell(1, 6, 1, 10, true);

    worksheet.cell(2, 1).string("⚠️ Kỳ thanh toán phải đúng format Tháng-Năm. Ví dụ: 12-2024, 01-2025,...").style({
      font: { bold: true, color: '#FF0000', fontSize: 14, name: 'Times New Roman' },
    });

    const finalHeaderNames = ["Tiền trước thuế", "Thuế", "Tiền sau thuế", "Ngày thực chi", "Trạng thái"];

    let colIndex = 1;
    headers
      .filter(header => !finalHeaderNames.includes(header.name) && header.isPrice === 0)
      .forEach(header => {
        worksheet.cell(3, colIndex).string(header.name).style(headerStyle);
        colIndex++;
      });
    const salaryHeaders = headers.filter(header => header.type === 'OTHER');
    const deductionHeaders = headers.filter(header => header.type === 'DEDUCTION');

    if (salaryHeaders.length > 0) {
      const salaryStartCol = colIndex;

      salaryHeaders.forEach(header => {
        const headerDetails =
          header.formulaType === 'BASE_SALARY'
            ? ['Đơn giá', 'Số lượng', 'Ngày công chuẩn']
            : header.formulaType === 'FIXED_COST' || header.formulaType === 'VARIABLE_COST'
              ? ['Đơn giá', 'Số lượng']
              : ['Số lượng'];

        const mergeStart = colIndex;
        headerDetails.forEach((detail, detailIndex) => {
          worksheet.cell(5, colIndex + detailIndex).string(detail).style(headerStyle);
        });

        // Merge tiêu đề loại chi phí (e.g., "Lương", "Hỗ trợ ăn trưa")
        worksheet.cell(4, mergeStart, 4, colIndex + headerDetails.length - 1, true).string(`${header.name} (${header.id})`).style(headerStyle);
        colIndex += headerDetails.length;
      });

      // Merge tiêu đề chính "Lương"
      worksheet.cell(3, salaryStartCol, 3, colIndex - 1, true).string('Chi phí').style(headerStyle);
    }

    if (deductionHeaders.length > 0) {
      const deductionStartCol = colIndex;

      deductionHeaders.forEach(header => {
        const headerDetails =
          header.formulaType === 'BASE_SALARY'
            ? ['Đơn giá', 'Số lượng', 'Ngày công chuẩn']
            : header.formulaType === 'FIXED_COST' || header.formulaType === 'VARIABLE_COST'
              ? ['Đơn giá', 'Số lượng']
              : ['Số lượng'];

        const mergeStart = colIndex;
        headerDetails.forEach((detail, detailIndex) => {
          worksheet.cell(5, colIndex + detailIndex).string(detail).style(headerStyle);
        });

        // Merge tiêu đề loại chi phí (e.g., "Lương giảm trừ", "Tiền giảm trừ")
        worksheet.cell(4, mergeStart, 4, colIndex + headerDetails.length - 1, true).string(`${header.name} (${header.id})`).style(headerStyle);
        colIndex += headerDetails.length;
      });

      // Merge tiêu đề chính "Giảm trừ"
      worksheet.cell(3, deductionStartCol, 3, colIndex - 1, true).string('Giảm trừ').style(headerStyle);
    }

    headers
      .filter(header => finalHeaderNames.includes(header.name) && header.isPrice === 0)
      .forEach(header => {
        worksheet.cell(3, colIndex).string(header.name).style(headerStyle);
        colIndex++;
      });

    for (let i = 1; i < colIndex; i++) {
      worksheet.column(i).setWidth(i <= 4 ? 25 : i >= colIndex - 5 ? 20 : 20);
    }

    let rowIndex = 6;

    if (data && data.length > 0) {
      data.forEach((entity) => {
        // Điền thông tin cơ bản
        worksheet.cell(rowIndex, 1).string(entityMapping.branch(entity)).style(style);
        worksheet.cell(rowIndex, 2).string(entityMapping.expenseName(entity)).style(style);

        let currentCol = 4; // Bắt đầu sau các cột thông tin cơ bản

        worksheet.cell(rowIndex, 3).string(entityMapping.billingCycle(entity)).style(style);
        headers.forEach((header) => {
          if (header.isPrice === 1) {
            const expenseItemValues = entityMapping.expenseItems(entity, header.id) || {};
            const price = expenseItemValues.price || 0;
            const quantity = expenseItemValues.quantity || 0;
            const baseQuantity = expenseItemValues.baseQuantity || 0;

            if (header.formulaType === 'BASE_SALARY') {
              worksheet.cell(rowIndex, currentCol).number(price).style(numberStyle); // Đơn giá
              worksheet.cell(rowIndex, currentCol + 1).number(quantity).style(style); // Số lượng
              worksheet.cell(rowIndex, currentCol + 2).number(baseQuantity).style(style); // Ngày công chuẩn
              currentCol += 3;
            } else if (header.formulaType === 'FIXED_COST') {
              worksheet.cell(rowIndex, currentCol).number(price).style(numberStyle); // Đơn giá
              worksheet.cell(rowIndex, currentCol + 1).number(quantity).style(style); // Số lượng
              currentCol += 2;
            } else if (header.formulaType === 'TIERED_COST') {
              worksheet.cell(rowIndex, currentCol).number(quantity).style(style); // Số lượng
              currentCol += 1;
            } else {
              worksheet.cell(rowIndex, currentCol).number(price).style(numberStyle); // Đơn giá
              worksheet.cell(rowIndex, currentCol + 1).number(quantity).style(style); // Số lượng
              currentCol += 2;
            }
          }
        });
        worksheet.cell(rowIndex, currentCol).number(entityMapping.preTaxAmount(entity)).style(numberStyle);
        worksheet.cell(rowIndex, currentCol + 1).string(entityMapping.taxRate(entity)).style(style);
        worksheet.cell(rowIndex, currentCol + 2).number(entityMapping.totalAmount(entity)).style(numberStyle);
        worksheet.cell(rowIndex, currentCol + 3).string(entityMapping.expenseDate(entity)).style(style);
        worksheet.cell(rowIndex, currentCol + 4).string(entityMapping.status(entity)).style(style);
        rowIndex++;
      });
    }
    else {
      // Nếu không có dữ liệu, tạo sẵn 30 dòng trống
      for (let i = 0; i < 30; i++) {
        worksheet.cell(rowIndex, 1).string('').style(style); // Cột 1: Chi nhánh
        worksheet.cell(rowIndex, 2).string('').style(style); // Cột 2: Tên chi phí
        worksheet.cell(rowIndex, 3).string('').style(style); // Cột 3: Kỳ thanh toán
        let currentCol = 4;
        headers.forEach((header, colIndex) => {
          if (header.isPrice === 1) {
            if (header.formulaType === 'BASE_SALARY') {
              worksheet.cell(rowIndex, currentCol).style(numberStyle); // Đơn giá
              worksheet.cell(rowIndex, currentCol + 1).style(style); // Số lượng
              worksheet.cell(rowIndex, currentCol + 2).style(style); // Ngày công chuẩn
              currentCol += 3;
            } else if (header.formulaType === 'FIXED_COST') {
              worksheet.cell(rowIndex, currentCol).style(numberStyle); // Đơn giá
              worksheet.cell(rowIndex, currentCol + 1).style(style); // Số lượng
              currentCol += 2;
            } else if (header.formulaType === 'TIERED_COST') {
              worksheet.cell(rowIndex, currentCol).style(style); // Số lượng
              currentCol += 1;
            } else {
              worksheet.cell(rowIndex, currentCol).style(numberStyle); // Đơn giá
              worksheet.cell(rowIndex, currentCol + 1).style(style); // Số lượng
              currentCol += 2;
            }
          }
        });
        rowIndex++;
      }
    }

    const branchSheet = workbook.addWorksheet('Danh sách chi nhánh');
    branches.forEach((branch: any, index) => {
      branchSheet.cell(index + 1, 1).string(`${branch.branchName} (ID: ${branch.id})`);
    });

    worksheet.addDataValidation({
      type: 'list',
      allowBlank: false,
      prompt: 'Chọn chi nhánh từ danh sách',
      error: 'Vui lòng chọn một chi nhánh hợp lệ từ danh sách',
      sqref: `A6:A1000`, // Cột A từ dòng 6 đến dòng cuối
      formulas: [`='Danh sách chi nhánh'!$A$1:$A$${branches.length}`],
    });

    return new Promise((resolve, reject) => {
      workbook.writeToBuffer()
        .then((buffer) => resolve(buffer))
        .catch((error) => reject(error));
    });
  }


  async importExpenseExcel(buffer: Buffer, headers: any[]): Promise<any[]> {
    // Đọc tệp Excel từ buffer
    console.log("reading excel file...");

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]; // Chọn sheet đầu tiên
    const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const fixedHeaders = ["Chi nhánh", "Tên chi phí", "Kỳ thanh toán"];
    const mainHeaders = sheetData[2]; // Dòng tiêu đề chính (dòng 3)
    const subHeaders = sheetData[4]; // Dòng tiêu đề con (dòng 4)

    for (let i = 0; i < fixedHeaders.length; i++) {
      if (mainHeaders[i]?.trim() !== fixedHeaders[i]) {
        throw new Error(
          `File Excel không đúng định dạng. Thiếu hoặc sai tiêu đề cố định: "${fixedHeaders[i]}" tại cột ${i + 1}`
        );
      }
    }

    console.log("Fixed headers validated successfully!");

    const expectedMainHeaders: string[] = [];
    const expectedSubHeaders: string[] = [];

    headers.forEach((header) => {
      if (header.isPrice === 1) {
        if (header.formulaType === 'BASE_SALARY') {
          expectedMainHeaders.push(header.name); // Thêm tiêu đề chính
          expectedSubHeaders.push("Đơn giá", "Số lượng", "Ngày công chuẩn"); // Thêm các tiêu đề con
        } else if (header.formulaType === 'FIXED_COST') {
          expectedMainHeaders.push(header.name); // Thêm tiêu đề chính
          expectedSubHeaders.push("Đơn giá", "Số lượng"); // Thêm các tiêu đề con
        } else if (header.formulaType === 'TIERED_COST') {
          expectedMainHeaders.push(header.name); // Thêm tiêu đề chính
          expectedSubHeaders.push("Số lượng"); // Thêm các tiêu đề con
        } else {
          expectedMainHeaders.push(header.name); // Thêm tiêu đề chính
          expectedSubHeaders.push("Đơn giá", "Số lượng"); // Thêm các tiêu đề con
        }
      }
    });

    // Kiểm tra tiêu đề con
    let subHeaderIndex = 3; // Cột bắt đầu chứa tiêu đề con
    for (const header of headers) {
      if (header.isPrice === 1) {
        const subHeadersForHeader = [];
        if (header.formulaType === 'BASE_SALARY') {
          subHeadersForHeader.push("Đơn giá", "Số lượng", "Ngày công chuẩn");
        } else if (header.formulaType === 'FIXED_COST') {
          subHeadersForHeader.push("Đơn giá", "Số lượng");
        } else if (header.formulaType === 'TIERED_COST') {
          subHeadersForHeader.push("Số lượng");
        } else {
          subHeadersForHeader.push("Đơn giá", "Số lượng");
        }

        for (const subHeader of subHeadersForHeader) {
          if (subHeaders[subHeaderIndex] !== subHeader) {
            console.error(`File Excel không đúng định dạng. Tiêu đề con không đúng tại cột ${subHeaderIndex + 1}`);
            throw new Error(`File Excel không đúng định dạng. Tiêu đề con không đúng tại cột ${subHeaderIndex + 1}`);
          }
          subHeaderIndex++;
        }
      }
    }

    console.log("File Excel đúng định dạng. Tiến hành đọc dữ liệu...");


    const data = [];
    const expenseItemsStartCol = 3; // Cột đầu tiên chứa chi tiêu

    // Bắt đầu từ hàng 6, lặp qua dữ liệu để xử lý
    for (let rowIndex = 5; rowIndex < sheetData.length; rowIndex++) {
      const row: any = sheetData[rowIndex];
      if (!row || row.every(cell => cell === null || cell === undefined || cell.toString().trim() === '')) continue;

      const branchMatch = row[0]?.match(/\(ID: (\d+)\)/);
      const expenseName = row[1]?.trim();
      const monthYear = row[2]?.trim();
      const branchId = branchMatch ? parseInt(branchMatch[1], 10) : null;

      const expenseItems = [];
      let headerIndex = expenseItemsStartCol;

      headers.forEach((header) => {
        if (header.isPrice === 1) {
          let expenseItem = {
            expenseTypeId: header.id,
            type: header.type,
            formulaType: header.formulaType,
            price: 0,
            quantity: 0,
            baseQuantity: 0,
          };
          // Determine how to map columns based on the formula type
          if (header.formulaType === 'BASE_SALARY') {
            expenseItem.price = row[headerIndex] || 0;
            expenseItem.quantity = row[headerIndex + 1] || 0;
            expenseItem.baseQuantity = row[headerIndex + 2] || 0;
            headerIndex += 3; // Move to the next set of columns
          } else if (header.formulaType === 'FIXED_COST') {
            expenseItem.price = row[headerIndex] || 0;
            expenseItem.quantity = row[headerIndex + 1] || 0;
            headerIndex += 2; // Move to the next set of columns
          } else if (header.formulaType === 'TIERED_COST') {
            expenseItem.quantity = row[headerIndex] || 0; // Only quantity is relevant
            headerIndex += 1; // Move to the next column
          } else {
            // Default to 'Đơn giá' and 'Số lượng'
            expenseItem.price = row[headerIndex] || 0;
            expenseItem.quantity = row[headerIndex + 1] || 0;
            headerIndex += 2; // Move to the next set of columns
          }
          expenseItems.push(expenseItem); // Add validated expenseItem to the array
        }
      });

      if (expenseItems.length > 0 || expenseName || monthYear || branchId !== null) {
        data.push({
          employeeId: null,
          expenseName: expenseName,
          billingCycle: monthYear,
          branchId: branchId,
          taxRate: 10,
          type: ExpenseCategory.OTHER,
          expenseItems,
        });
      }
    }
    console.log("reading excel file done...");

    return data;
  }
}
