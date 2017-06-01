/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import AVectorColumn, {ITaggleHistogramData} from './AVectorColumn';
import {ICategoricalVector} from 'phovea_core/src/vector';
import {IMultiFormOptions} from 'phovea_core/src/multiform';
import {EOrientation} from './AColumn';
import {mixin} from 'phovea_core/src/index';
import VisManager from './VisManager';
import {on, fire} from 'phovea_core/src/event';
import {EAggregationType} from './VisManager';


export default class CategoricalColumn extends AVectorColumn<string, ICategoricalVector> {

  static readonly EVENT_STRATIFYME = 'stratifyByMe';
  static readonly EVENT_UNSTRATIFYME = 'unstratifyByMe';

  minWidth: number = 2;
  maxWidth: number = 70;
  minHeight: number = 4;
  maxHeight: number = 20;

  constructor(data: ICategoricalVector, orientation: EOrientation, $parent: d3.Selection<any>) {
    super(data, orientation);
    this.$node = this.build($parent);
    this.attachListener();
  }

  protected multiFormParams($body: d3.Selection<any>, histogramData?: ITaggleHistogramData): IMultiFormOptions {
    return mixin(super.multiFormParams($body), {
      initialVis: VisManager.getDefaultVis(this.data.desc.type, this.data.desc.value.type, EAggregationType.UNAGGREGATED),
      'phovea-vis-histogram': {
        nbins: histogramData.nbins,
        maxValue: histogramData.maxValue
      },
      'taggle-vis-onebin-histogram': {
        nbins: histogramData.nbins,
        maxValue: histogramData.maxValue
      },
      all: {
        heightTo: this.orientation === EOrientation.Horizontal ? VisManager.heatmap1DOptions.rowMaxHeight : $body.property('clientHeight'),
      }
    });
  }

  private attachListener() {
    const $stratifyButton = this.toolbar.select('div.onHoverToolbar').insert('a', ':first-child')
      .attr('title', 'Stratify table by this column')
      .classed('stratifyByMe', true)
      .html(`<i class="fa fa-columns fa-rotate-270 fa-fw" aria-hidden="true"></i><span class="sr-only">Stratify table by this column</span>`)
      .on('click', () => { // change stratification
        if($stratifyButton.classed('active')) {
          fire(CategoricalColumn.EVENT_UNSTRATIFYME, this);
        } else {
          fire(CategoricalColumn.EVENT_STRATIFYME, this);
        }
      });

    on(CategoricalColumn.EVENT_STRATIFYME, (evt, ref) => {
      if (ref.data.desc.id === this.data.desc.id) {
        $stratifyButton.classed('active', true);
        this.fire(CategoricalColumn.EVENT_STRATIFYME, this); // for stratifying in the ColumnManager
      }
    });

    on(CategoricalColumn.EVENT_UNSTRATIFYME, (evt, ref) => {
      if (ref.data.desc.id === this.data.desc.id) {
        $stratifyButton.classed('active', false);
        this.fire(CategoricalColumn.EVENT_UNSTRATIFYME, this); // for unstratifying in the ColumnManager
      }
    });
  }

  showStratIcon(isVisible: boolean) {
    this.toolbar.select('.fa-columns').classed('hidden', !isVisible);
  }

  stratifyByMe(isTrue: boolean) {
    this.toolbar.select('.stratifyByMe').classed('active', isTrue);
  }


}
