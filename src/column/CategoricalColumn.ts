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
import {EAggregationType} from './VisManager';


export default class CategoricalColumn extends AVectorColumn<string, ICategoricalVector> {

  static readonly EVENT_STRATIFYME = 'stratifyByMe';

  minWidth: number = 2;
  maxWidth: number = 140;
  minHeight: number = 1;
  maxHeight: number = 25;

  constructor(data: ICategoricalVector, orientation: EOrientation, $parent: d3.Selection<any>) {
    super(data, orientation);
    this.$node = this.build($parent);
    this.attachListener();
  }

  protected multiFormParams($body: d3.Selection<any>): IMultiFormOptions {
    return mixin(super.multiFormParams($body), {
      initialVis: VisManager.getDefaultVis(this.data.desc.type, this.data.desc.value.type, EAggregationType.UNAGGREGATED),
      all: {
        heightTo: this.orientation === EOrientation.Horizontal ? VisManager.heatmap1DOptions.rowMaxHeight : $body.property('clientHeight'),
      }
    });
  }


  private attachListener() {
    const $stratifyButton = this.toolbar.insert('a', ':first-child')
      .attr('title', 'Stratify table by this column')
      .html(`<i class="fa fa-bars fa-fw" aria-hidden="true"></i><span class="sr-only">Stratify table by this column</span>`)
      .on('click', () => {
        this.fire(CategoricalColumn.EVENT_STRATIFYME, this); // for stratifying in the ColumnManager
        fire(CategoricalColumn.EVENT_STRATIFYME, this); // for updating the filter and other columns
      });

    on(CategoricalColumn.EVENT_STRATIFYME, (evt, ref) => {
      $stratifyButton.classed('active', ref.data.desc.id === this.data.desc.id);
    });
  }

}
