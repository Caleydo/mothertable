/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import AColumn, {EOrientation} from './AColumn';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {IMultiFormOptions} from 'phovea_core/src/multiform';
import {IDataType} from 'phovea_core/src/datatype';
import Range from 'phovea_core/src/range/Range';
import {join} from 'phovea_core/src/range';
import {scaleTo, NUMERICAL_COLOR_MAP, mergeRanges} from './utils';
import {createColumn, AnyColumn, IMotherTableType} from './ColumnManager';
import * as d3 from 'd3';
import VisManager from './VisManager';
import AColumnManager from './AColumnManager';
import {AnyFilter, default as AFilter} from '../filter/AFilter';
import {EAggregationType} from './VisManager';
import TaggleMultiform from './TaggleMultiform';
import CategoricalColumn from './CategoricalColumn';
import {on} from 'phovea_core/src/event';

export const AGGREGATE = {
  min: 'min',
  max: 'max',
  mean: 'mean',
  median: 'median',
  q1: 'q1',
  q3: 'q3'

};

export default class MatrixColumn extends AColumn<number, INumericalMatrix> {
  minWidth: number = 150;
  maxWidth: number = 300;
  minHeight: number = 2;
  maxHeight: number = 20;

  maxNumBins: number = 25;

  private rowRanges: Range[] = [];
  private stratifiedRanges: Range[] = [];
  private brushedRanges: Range[] = [];
  colRange: Range;
  dataView: IDataType;
  private matrixViews;

  private $colStrat: d3.Selection<any>;
  private colStratManager: AColumnManager = new AColumnManager();
  public static EVENT_CONVERT_TO_VECTOR = 'convertMatrix';

  constructor(data: INumericalMatrix, orientation: EOrientation, $columnParent: d3.Selection<any>, matrixCol?) {
    super(data, orientation);
    this.dataView = data;
    this.calculateDefaultRange();
    this.$node = this.build($columnParent);
    this.attachListener();

  }

  protected build($parent: d3.Selection<any>): d3.Selection<any> {
    const $node = super.build($parent);
    $node.classed('column-matrix', true);
    this.$colStrat = $node.select('aside')
      .append('ol')
      .attr('reversed', 'reversed');

    return $node;
  }

  setFixedWidth(width: number) {
    if (isNaN(width)) {
      return;
    }

    // scale all column stratifications
    this.colStratManager.columns.forEach((col) => {
      col.width = width;
      col.multiformList.forEach((multiform) => {
        scaleTo(multiform, width, multiform.size[1], col.orientation);
      });
    });

    super.setFixedWidth(width);
  }

  protected multiFormParams($body: d3.Selection<any>): IMultiFormOptions {
    return {
      initialVis: VisManager.getDefaultVis(this.data.desc.type, this.data.desc.value.type, EAggregationType.UNAGGREGATED),
      'phovea-vis-heatmap': {
        color: NUMERICAL_COLOR_MAP,
        domain: this.data.valuetype.range,
        mode: 'lg'
      },
      'phovea-vis-histogram': {
        nbins: Math.min(this.maxNumBins, Math.floor(Math.sqrt(this.data.length))),
        color: 'grey'
      },
      all: {
        heightTo: $body.property('clientHeight')
      }
    };
  }

  remove(col: IDataType) {
    this.colStratManager.remove(col);
  }


  async updateMultiForms(rowRanges?: Range[], stratifiedRanges?: Range[], brushedRanges?: Range[], colRange?: Range) {
    const that = this;

    this.stratifiedRanges = stratifiedRanges;
    this.brushedRanges = brushedRanges;

    if (!rowRanges) {
      rowRanges = this.rowRanges;
    }
    this.rowRanges = rowRanges;
    // console.log((colRange), 'colrange');

    if (!colRange) {
      colRange = (await this.calculateDefaultRange());
      //BUG? why is this just updated if the argument is not given while for rowRanges it will always be updated
      this.colRange = colRange;
    }
    // this.colRange = colRange;
    const mergedRange = mergeRanges(rowRanges);
    this.dataView = await this.data.idView(join(mergedRange, colRange));

    const viewPromises = rowRanges.map((r) => {
      return this.data.idView(join(r, colRange));
    });

    return Promise.all(viewPromises).then((views) => {
      const viewData = views.map((d: any) => {
        return {
          //HACK .range is not accessible
          key: d.range.toString(),
          view: d,
        };
      });

      const multiformList = this.body.selectAll('.multiformList').data(viewData, (d) => d.key);

      multiformList.enter().append('div')
        .classed('multiformList', true)
        .each(function (this: HTMLDivElement, d) {
          const $elem = d3.select(this);
          const m = new TaggleMultiform(d.view, this, that.multiFormParams($elem));
          that.multiformMap.set(d.key, m);
        });

      multiformList
        .each(function (d, i) {
          const m = that.multiformMap.get(d.key);
          m.groupId = that.findGroupId(stratifiedRanges, rowRanges[i]);
          m.brushed = that.checkBrushed(brushedRanges, rowRanges[i]);

          //assign visses
          if (that.selectedAggVis) {
            VisManager.userSelectedAggregatedVisses.set(m.id, that.selectedAggVis);
          }
          if (that.selectedUnaggVis) {
            VisManager.userSelectedUnaggregatedVisses.set(m.id, that.selectedUnaggVis);
          }
          VisManager.multiformAggregationType.set(m.id, EAggregationType.UNAGGREGATED);
        });

      multiformList.exit().remove()
        .each(function (d) {
          that.multiformMap.delete(d.key);
        });

      // order DOM elements according to the data order
      multiformList.order();

      return this.multiformList;
    });
  }

  async calculateDefaultRange() {
    if (this.colRange === undefined) {
      this.colRange = await this.data.colIds();
    }
    return this.colRange;
  }

  /**
   *
   * @param data
   * @returns {Promise<AnyColumn>}
   */
  pushColStratData(data: IMotherTableType) {
    return Promise.all([this.data.colIds(), data.ids()])
      .then((results) => {
        const colRange = results[0];
        const vectorRange = results[1];

        const vr = vectorRange.intersect(colRange);
        const dataView: any = data.idView(vr);

        return dataView.then((coldata) => {
          const col = createColumn(coldata, EOrientation.Horizontal, this.$colStrat);
          this.colStratManager.add(col);
          return col;
        });

      });

  }

  /**
   *
   * @returns {Promise<void>}
   */
  async updateColStrats() {

    const rangeListMap: Map<string, Range[]> = await this.colStratManager.sort();
    //  console.log(this.colStratManager.columns, rangeListMap, this.rowRanges, this.stratifiedRanges, this.brushedRanges, this.colRange)
    this.colRange = this.colStratManager.nonStratifiedRange;
    this.updateMultiForms(this.rowRanges, this.stratifiedRanges, this.brushedRanges, this.colRange);
    this.colStratManager.stratify(rangeListMap);
  }

  async filterStratData(range: Range) {
    await this.colStratManager.filter(range);
    this.colRange = range;
    this.updateColStrats();
  }

  sortByFilterHeader(sortData: { col: AnyColumn, sortMethod: string }) {
    const col = this.colStratManager.columns.find((d) => d.data.desc.id === sortData.col.data.desc.id);
    if (!col) {
      return;
    }
    col.sortCriteria = sortData.sortMethod;
    this.updateColStrats();
  }

  updateColStratsSorting(filterList: AnyFilter[]) {
    this.colStratManager.sortByFilters(filterList);
    this.updateColStrats();
    // TODO still need to update the DOM order in `this.$colStrat`
  }

  get colStratsColumns() {
    return this.colStratManager.columns;
  }


  private stratifyMe = (event: any, colid) => {
    const s = this.colStratManager.updateStratifiedRanges(colid);
    this.makeMatrixView(s);
  }


  private makeMatrixView(s?: Range[]) {

    //If there is zero and not matching columns return nothing
    if (s === undefined) {
      //QUESTION: why not resetting the matrix views?
      return;
    }
    const mergedRange = mergeRanges(this.rowRanges);
    Promise.all(s.map(async (r) => {
      return this.data.idView(join(mergedRange, r));
    })).then((views) => {
      this.matrixViews = views;
    });
  }

  private attachListener() {
    //BUG who is degregistering this listener again?
    on(CategoricalColumn.EVENT_STRATIFYME, this.stratifyMe);
  }

  protected buildToolbar($toolbar: d3.Selection<any>) {
    const that = this;
    super.buildToolbar($toolbar);
    const $hoverToolbar = $toolbar.select('div.onHoverToolbar');

    const options = ['select', AGGREGATE.min, AGGREGATE.max, AGGREGATE.mean, AGGREGATE.median, AGGREGATE.q1, AGGREGATE.q3];

    const $select = $hoverToolbar.append('select')
      .attr('class', 'aggSelect')
      .on('change', function(this: HTMLSelectElement) {
        //BUG what if the value is 'select'?
        that.fire(MatrixColumn.EVENT_CONVERT_TO_VECTOR, that.matrixViews, this.value, that);
      });

    $select
      .selectAll('option')
      .data(options).enter()
      .append('option')
      .text((d) => d);
  }
}
