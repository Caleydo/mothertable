/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import AVectorColumn from './AVectorColumn';
import {ICategoricalVector} from 'phovea_core/src/vector';
import {IMultiFormOptions} from 'phovea_core/src/multiform';
import {EOrientation} from './AColumn';
import {mixin} from 'phovea_core/src/index';
import VisManager from './VisManager';
import {on, fire} from 'phovea_core/src/event';

export default class CategoricalColumn extends AVectorColumn<string, ICategoricalVector> {

  static readonly EVENT_STRATIFYME = 'stratifyByMe';

  minWidth: number = 2;
  maxWidth: number = 200; //80
  minHeight: number = 2;
  maxHeight: number = 25;

  constructor(data: ICategoricalVector, orientation: EOrientation, $parent: d3.Selection<any>) {
    super(data, orientation);
    this.$node = this.build($parent);
    this.attachListener();
  }

  protected multiFormParams($body: d3.Selection<any>): IMultiFormOptions {
    return mixin(super.multiFormParams($body), {
      initialVis: VisManager.getDefaultVis(this.data.desc.type, this.data.desc.value.type, VisManager.aggregationType.UNAGGREGATED),
    });
  }


  private attachListener() {
    const $stratifyButton = this.toolbar.insert('a', ':first-child')
      .attr('title', 'Stratify table by this column')
      .html(`<i class="fa fa-bars fa-fw" aria-hidden="true"></i><span class="sr-only">Stratify table by this column</span>`)
      .on('click', () => {
        this.fire(CategoricalColumn.EVENT_STRATIFYME, this);
        fire(CategoricalColumn.EVENT_STRATIFYME, this);
      });

    on(CategoricalColumn.EVENT_STRATIFYME, (evt, ref) => {
      $stratifyButton.classed('active', ref.data.desc.id === this.data.desc.id);
    });
  }

}
