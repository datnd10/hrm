import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";

import { NgbModule } from "@ng-bootstrap/ng-bootstrap";

import { CoreCommonModule } from "@core/common.module";
import { AccountProfileComponent } from "./account-profile/account-profile.component";

// routing
const routes: Routes = [
  {
    path: "profile",
    component: AccountProfileComponent,
    data: { animation: "auth" },
  },
];

@NgModule({
  declarations: [AccountProfileComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NgbModule,
    FormsModule,
    ReactiveFormsModule,
    CoreCommonModule,
  ],
})
export class AccountProfileModule {}
