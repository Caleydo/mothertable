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
import MatrixColumn, {AGGREGATE} from './MatrixColumn';

export default class NumberColumn extends AVectorColumn<number, INumericalVector> {

  minWidth: number = 2;
  maxWidth: number = 70;
  minHeight: number = 4;
  maxHeight: number = 20;
  projectedMatrix: boolean = false;
  matrixViewRange: Range;

  private $points: d3.Selection<any>;
  private $axis: d3.Selection<any>;
  private scale: d3.scale.Linear<number, number> = d3.scale.linear();
  private axis: d3.svg.Axis = d3.svg.axis();

  public static EVENT_CONVERT_TO_MATRIX = 'convertToMatrix';
  public static EVENT_CHANGE_AGG_FUNC = 'ChangeAggFunc';

  constructor(data: INumericalVector, orientation: EOrientation, $parent: d3.Selection<any>, matrixCol?: MatrixColumn) {
    super(data, orientation);
    this.$node = this.build($parent);
    this.attachListener();
  }

  protected buildToolbar($toolbar: d3.Selection<any>) {
    super.buildToolbar($toolbar);
    this.buildAxis($toolbar);
  }

  private buildAxis($toolbar: d3.Selection<any>) {
    this.$points = $toolbar.select('svg').append('g').classed('points', true);
    this.$axis = $toolbar.select('svg').append('g').classed('axis', true);
    const width = $toolbar.node().parentElement.getBoundingClientRect().width;

    this.scale
      .range([0, width])
      .domain((this.data.desc).value.range);

    const tickCount = 0;
    this.axis
      .ticks(tickCount)
      .tickFormat(d3.format('.2s'))
      .outerTickSize(8)
      .orient('bottom')
      .scale(this.scale)
      .tickValues(this.scale.ticks(tickCount).concat(this.scale.domain()));

    this.$axis.call(this.axis);
  }

  public updateAxis(brushedItems: number[][]) {
    const axis = this.$node.selectAll('taggle-axis')[0];
    const brushedData = [];

    this.$points.selectAll('line').remove();

    this.data.forEach((d, i) => {
      brushedItems.forEach((brush) => {
        if (brush.indexOf(i) > -1) {
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

  private updateAxisScale() {
    this.scale.range([0, this.width]);
    this.$axis.call(this.axis);
  }

  setFixedWidth(width: number) {
    if (isNaN(width)) {
      return;
    }
    super.setFixedWidth(width);
    this.updateAxisScale();
  }

  protected multiFormParams($body: d3.Selection<any>, histogramData?: ITaggleHistogramData): IMultiFormOptions {
    return mixin(super.multiFormParams($body), {
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
    const options = ['select', AGGREGATE.min, AGGREGATE.max, AGGREGATE.mean, AGGREGATE.median, AGGREGATE.q1, AGGREGATE.q3];
    const $vectorChange = this.toolbar.select('div.onHoverToolbar').append('select')
      .attr('class', 'aggSelect')
      .on('change', (d, i) => {
        const value = this.toolbar.select('div.onHoverToolbar').select('select').property('value');
        this.fire(NumberColumn.EVENT_CHANGE_AGG_FUNC, value, this);
      });
    $vectorChange
      .selectAll('option')
      .data(options).enter()
      .append('option')
      .text((d) => d);
  }

}
