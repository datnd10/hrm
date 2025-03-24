import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';
import * as feather from 'feather-icons';
@Component({
  selector: 'app-action',
  templateUrl: './action.component.html',
  styleUrls: ['./action.component.scss']
})
export class ActionComponent implements AfterViewInit {
  @Input() showActionButton: boolean = false;
  @Input() showExportImportButton: boolean = false;
  @Input() showChangeStatusButton: boolean = false;
  @Input() showSaveButton: boolean = false;
  @Input() tableTitle: string = '';
  @Input() anySelected: () => boolean;
  @Input() tableData: any[] = [];

  @Output() onAdd = new EventEmitter<void>();
  @Output() onExportImport = new EventEmitter<string>();
  @Output() onSendSelected = new EventEmitter<{ action: string }>();
  ngAfterViewInit(): void {
    // Khởi tạo Feather Icons ngay sau khi Action Component được render
    feather.replace();
  }


  addRecord() {
    this.onAdd.emit();
  }

  exportImport(action: 'import' | 'export') {
    this.onExportImport.emit(action);
  }

  sendSelectedDatas(action: string) {
    this.onSendSelected.emit({ action });
  }
}
