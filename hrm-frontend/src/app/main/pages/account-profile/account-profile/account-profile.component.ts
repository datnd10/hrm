import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthenticationService } from "app/auth/service";
import { EmployeeService } from "app/main/apps/hrm-setting/employee/employee.service";
import { ToastrService } from "ngx-toastr";
import { noFutureDateValidator } from "common/validation";
import { ValidationPatterns } from "common/validation-patterns";

@Component({
  selector: "app-account-profile",
  templateUrl: "./account-profile.component.html",
  styleUrls: ["./account-profile.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class AccountProfileComponent implements OnInit {
  employee: any = {};
  passwordForm: FormGroup;
  editEmployeeForm: FormGroup;
  isModalOpen = false;

  constructor(
    private fb: FormBuilder,
    private _employeeService: EmployeeService,
    private _authenticationService: AuthenticationService,
    private route: ActivatedRoute,
    private _toastrService: ToastrService,
    private _router: Router
  ) {}

  ngOnInit(): void {
    // Initialize password form
    this.passwordForm = this.fb.group(
      {
        currentPassword: ["", [Validators.required, Validators.minLength(6)]],
        newPassword: ["", [Validators.required, Validators.minLength(6)]],
        confirmPassword: ["", Validators.required],
      },
      {
        validator: this.passwordMatchValidator,
      }
    );

    // Initialize edit employee form
    this.editEmployeeForm = this.fb.group({
      fullName: ["", [Validators.required, Validators.minLength(3)]],
      gender: ["", Validators.required],
      dateOfBirth: ["", [Validators.required, noFutureDateValidator()]],
      email: ["", [Validators.required, Validators.email]],
      taxCode: ["", [Validators.pattern(ValidationPatterns.TAX_CODE)]],
      idCard: [
        "",
        [
          Validators.required,
          Validators.minLength(9),
          Validators.maxLength(12),
        ],
      ],
      phoneNumber: [
        "",
        [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)],
      ],
      specificAddress: ["", Validators.required],
    });

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const currentUserId = currentUser?.data?.user?.id;
    if (currentUserId) {
      this.getEmployeeDetails(currentUserId);
    } else {
      console.error("Không tìm thấy userId của người dùng hiện tại");
    }
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get("newPassword").value === form.get("confirmPassword").value
      ? null
      : { mismatch: true };
  }

  // Change password logic
  onChangePassword() {
    if (this.passwordForm.invalid) {
      this._toastrService.error(
        "Form không hợp lệ. Vui lòng kiểm tra lại.",
        "Lỗi"
      );
      return;
    }

    const { currentPassword, newPassword } = this.passwordForm.value;
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const currentUserId = currentUser?.data?.user?.id;

    if (!currentUserId) {
      this._toastrService.error(
        "Không tìm thấy userId của người dùng hiện tại.",
        "Lỗi"
      );
      return;
    }

    this._authenticationService
      .changePassword(currentUserId, currentPassword, newPassword)
      .subscribe(
        () => {
          this._toastrService.success("Đổi mật khẩu thành công!");
          this.passwordForm.reset();
        },
        (error) => {
          console.error("Lỗi khi đổi mật khẩu:", error);
          this._toastrService.error(
            "Đổi mật khẩu thất bại. Vui lòng thử lại.",
            "Lỗi"
          );
        }
      );
  }

  // Fetch employee details
  getEmployeeDetails(userId: number): void {
    this._employeeService.findOneEmployee(userId).subscribe(
      (response) => {
        this.employee = response?.data || {};
        this.editEmployeeForm.patchValue(this.employee);
      },
      (error) => {
        console.error("Lỗi khi lấy thông tin nhân viên:", error);
        this.employee = {};
      }
    );
  }

  // Open modal
  openModal() {
    this.isModalOpen = true;
  }

  // Close modal
  closeModal() {
    this.isModalOpen = false;
  }

  // Save employee details
  saveEmployee() {
    if (this.editEmployeeForm.invalid) {
      this._toastrService.error(
        "Form không hợp lệ. Vui lòng kiểm tra lại.",
        "Lỗi"
      );
      return;
    }

    const employeeData = this.editEmployeeForm.value;

    this._employeeService
      .updateEmployee(this.employee.id, employeeData)
      .subscribe(
        () => {
          this.employee = { ...this.employee, ...employeeData };
          this._toastrService.success("Cập nhật thông tin thành công!");
          this.closeModal();
        },
        (error) => {
          console.error("Lỗi khi cập nhật thông tin nhân viên:", error);
          this._toastrService.error(
            "Cập nhật thông tin thất bại. Vui lòng thử lại.",
            "Lỗi"
          );
          this.closeModal();
        }
      );
  }
}
