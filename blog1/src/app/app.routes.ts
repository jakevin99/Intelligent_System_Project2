//src\app\app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { BlogDetailComponent } from './components/blog-detail/blog-detail.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { CreateBlogComponent } from './components/create-blog/create-blog.component';
import { EditBlogComponent } from './components/edit-blog/edit-blog.component';
import { AuthGuard } from './services/auth.guard';
import { UserHomeComponent } from './components/user-home/user-home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'blog/:id', component: BlogDetailComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { 
    path: 'create-blog', 
    component: CreateBlogComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'edit-blog/:id', 
    component: EditBlogComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'user-home', 
    component: UserHomeComponent,
    canActivate: [AuthGuard]
  },
];