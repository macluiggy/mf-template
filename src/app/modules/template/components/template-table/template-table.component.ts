import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { TemplateInterface } from '../../interfaces/template.interface';

/**
 * Presentational component: renders what it receives and emits user intent.
 * No services, no HTTP, no PubSub — the page (container) owns all of that.
 */
@Component({
  selector: 'app-template-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './template-table.component.html',
})
export class TemplateTableComponent {
  readonly items = input.required<TemplateInterface[]>();
  readonly selected = output<TemplateInterface>();
}
