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
import Range from 'phovea_core/src/range/Range';
import MatrixColumn from './MatrixColumn';

export default class NumberColumn extends AVectorColumn<number, INumericalVector> {

  minWidth: number = 2;
  maxWidth: number = 70;
  minHeight: number = 4;
  maxHeight: number = 20;
  projectedMatrix: boolean = false;
  matrixViewRange: Range;

  private $points:d3.Selection<any>;
  private scale: d3.scale.Linear<number, number>;
  public static EVENT_CONVERT_TO_MATRIX = 'convertToMatrix';

  constructor(data: INumericalVector, orientation: EOrientation, $parent: d3.Selection<any>, matrixCol?: MatrixColumn) {
    super(data, orientation);
    this.$node = this.build($parent);
    this.attachListener();
  }

  protected buildToolbar($toolbar: d3.Selection<any>) {
    super.buildToolbar($toolbar);
    this.$points = $toolbar.select('svg').append('g');
    const $svg = $toolbar.select('svg').append('g');
    const width =$toolbar.node().parentElement.getBoundingClientRect().width;

    this.scale = d3.scale.linear().range([0, width]).domain((this.data.desc).value.range);
    const tickCount = 2;
    const axis = d3.svg.axis()
      .ticks(tickCount)
      .tickFormat(d3.format('.2s'))
      .outerTickSize(8)
      .orient('bottom')
      .scale(this.scale);
    axis.tickValues(this.scale.ticks(tickCount).concat( this.scale.domain()));
    $svg.call(axis);
    const count = $svg.selectAll('.tick').size();
    $svg.selectAll('.tick').each(function(data, i) {
      if(i === count-1) {
        const tick = d3.select(this).select('text');
        tick.style('text-anchor', 'end');
      }
      if(i === count-2) {
        const tick = d3.select(this).select('text');
        tick.style('text-anchor', 'start');
      }
    });
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


  private attachListener() {
    if ((<any>this).data.m !== undefined) {
      // this.matrixViewRange = this.data.m.range.dim(1).asList();
      //  console.log(this.data.m, this.data.m.range.dim(1).asList())
      const $matrixChange = this.toolbar.insert('a', ':first-child')
        .attr('title', 'Aggregated Me')
        .html(`<i class="fa fa-exchange" aria-hidden="true"></i><span class="sr-only">Aggregate Me</span>`);

      $matrixChange.on('click', () => {
        this.fire(NumberColumn.EVENT_CONVERT_TO_MATRIX, this);
      });

    }


  }


}
