import { bootstrapApplication, BootstrapContext, provideClientHydration } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';
import { provideServerRendering } from '@angular/platform-server';

export default function bootstrap(context?: BootstrapContext) {
  return bootstrapApplication(AppComponent, {
    ...config,
    providers: [
      ...(config.providers ?? []),
      provideServerRendering(),
      provideClientHydration(),
    ],
  }, context);
}