/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import {AVectorColumn, ITaggleHistogramData} from './AVectorColumn';
import {INumericalVector} from 'phovea_core/src/vector';
import {IMultiFormOptions} from 'phovea_core/src/multiform';
import {EOrientation} from './AColumn';
import {mixin} from 'phovea_core/src/index';
import {NUMERICAL_COLOR_MAP} from './utils';
import * as d3 from 'd3';

export default class NumberColumn extends AVectorColumn<number, INumericalVector> {

  minWidth: number = 2;
  maxWidth: number = 140;
  minHeight: number = 4;
  maxHeight: number = 20;

  private $points:d3.Selection<any>;
  private scale: d3.scale.Linear<number, number>;

  constructor(data: INumericalVector, orientation: EOrientation, $parent: d3.Selection<any>) {
    super(data, orientation);
    this.$node = this.build($parent);
  }

  protected buildToolbar($toolbar: d3.Selection<any>) {
    super.buildToolbar($toolbar);
    this.$points = $toolbar.select('svg').append('g');
    const $svg = $toolbar.select('svg').append('g');
    const width = parseInt($toolbar.style('width'), 10);

    this.scale = d3.scale.linear().range([5, width - 5]).domain((this.data.desc).value.range);
    const axis =  d3.svg.axis()
      .ticks(3)
      .orient('bottom')
      .scale(this.scale);

    $svg.call(axis);
  }

  public updateAxis(brushedItems: number[][]) {
    const axis = this.$node.selectAll('taggle-axis')[0];
    const brushedData  = [];

    this.$points.selectAll('line').remove();

    this.data.forEach((d,i) => {
      brushedItems.forEach( (brush) => {
        if(brush.indexOf(i) > -1) {
          brushedData.push(d);
          this.$points.append('line').attr({
            'x1': this.scale(d),
            'x2': this.scale(d),
            'y1': 0,
            'y2': 6
          });
        }
      });
    });
  }


  protected multiFormParams($body: d3.Selection<any>, histogramData?: ITaggleHistogramData): IMultiFormOptions {
    return mixin(super.multiFormParams($body), {
      //initialVis: VisManager.getDefaultVis(this.data.desc.type, this.data.desc.value.type, EAggregationType.UNAGGREGATED),
      initialVis: 'barplot',
      'phovea-vis-heatmap1d': {
        color: NUMERICAL_COLOR_MAP,
        domain: this.data.valuetype.range
      },
      'barplot': {
        cssClass: 'taggle-vis-barplot',
        min: histogramData.domain[0],
        max: histogramData.domain[1]
      },
      'phovea-vis-histogram': {
        color: 'grey',
        nbins: histogramData.nbins,
        maxValue: histogramData.maxValue
      },
      'list': {
        cssClass: 'taggle-vis-list'
      },
      all: {
        heightTo: this.orientation === EOrientation.Horizontal ? 50 : $body.property('clientHeight'),
      }
    });
  }
}
