import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import {
  Chart,
  // Scales
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  LogarithmicScale,
  // Elements
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  // Controllers
  LineController,
  BarController,
  DoughnutController,
  PieController,
  PolarAreaController,
  RadarController,
  // Plugins
  Tooltip,
  Legend,
  Filler,
  Title,
  SubTitle,
} from 'chart.js';

// ✅ Register ALL controllers, scales, elements and plugins you use
Chart.register(
  // Scales
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  LogarithmicScale,
  // Elements
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  // Controllers
  LineController,
  BarController,
  DoughnutController,
  PieController,
  PolarAreaController,
  RadarController,
  // Plugins
  Tooltip,
  Legend,
  Filler,
  Title,
  SubTitle,
);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
