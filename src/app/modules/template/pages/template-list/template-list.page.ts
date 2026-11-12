import {
  ChangeDetectionStrategy,
  Component,
  inject,
  type OnInit,
  signal,
} from '@angular/core';

import { Notifier } from '../../../../core/notifier';
import { LoadingTrackerService } from '../../../../shared/services/loading-tracker.service';
import { TemplateTableComponent } from '../../components/template-table/template-table.component';
import { TEMPLATE_PAGE_SIZE } from '../../constants/template.constants';
import type { TemplateInterface } from '../../interfaces/template.interface';
import { TemplateService } from '../../services/template.service';

type ViewState = 'loading' | 'error' | 'ready';

/**
 * Container page: owns state (signals), calls the service and reports through
 * the `Notifier` and `LoadingTrackerService` ports (console by default, host
 * loader/toasts under the NEOCORE integration). Rendering is delegated to
 * presentational components.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TemplateTableComponent],
  selector: 'app-template-list-page',
  standalone: true,
  templateUrl: './template-list.page.html',
})
export class TemplateListPage implements OnInit {
  private readonly service = inject(TemplateService);
  private readonly notifier = inject(Notifier);
  private readonly loading = inject(LoadingTrackerService);

  protected readonly state = signal<ViewState>('loading');
  protected readonly items = signal<TemplateInterface[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly lastSelected = signal<TemplateInterface | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.service
      .list({ limit: TEMPLATE_PAGE_SIZE, page: this.page() })
      .pipe(this.loading.track)
      .subscribe({
        error: () => {
          this.state.set('error');
          this.notifier.error('The records could not be loaded.');
        },
        next: (res) => {
          this.items.set(res.data.records);
          this.total.set(res.data.total);
          this.state.set('ready');
        },
      });
  }

  protected onSelected(item: TemplateInterface): void {
    this.lastSelected.set(item);
  }
}
