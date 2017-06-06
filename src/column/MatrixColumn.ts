/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import AColumn, {EOrientation} from './AColumn';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {MultiForm, IMultiFormOptions} from 'phovea_core/src/multiform';
import {IDataType} from 'phovea_core/src/datatype';
import Range from 'phovea_core/src/range/Range';
import {list as rlist} from 'phovea_core/src/range';
import {scaleTo, NUMERICAL_COLOR_MAP, makeListFromRange, mergeRanges, makeRangeFromList} from './utils';
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

  setFixedWidth(width:number) {
    if(isNaN(width)) {
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
        domain: this.data.valuetype.range
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
      this.colRange = colRange;
    }
    // this.colRange = colRange;
    const mergedRange = mergeRanges(this.rowRanges);
    let rowView = await this.data.idView(mergedRange);
    rowView = (<INumericalMatrix>rowView).t;

    let colView = await rowView.idView(colRange);
    colView = (<INumericalMatrix>colView).t;
    this.dataView = colView;

    const viewPromises = rowRanges.map((r) => {
      return this.data.idView(r)
        .then((rowView) => (<INumericalMatrix>rowView).t)
        .then((rowViewMatrix) => rowViewMatrix.idView(colRange))
        .then((colView) => (<INumericalMatrix>colView).t);
    });

    return Promise.all(viewPromises).then((views) => {
      const viewData = views.map((d: any) => {
        return {
          key: d.range.toString(),
          view: d,
        };
      });

      const multiformList = this.body.selectAll('.multiformList').data(viewData, (d) => d.key);

      multiformList.enter().append('div')
        .classed('multiformList', true)
        .each(function (d) {
          const $elem = d3.select(this);
          const m = new TaggleMultiform(d.view, <HTMLElement>$elem.node(), that.multiFormParams($elem));
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
      const indices = await this.data.ids();
      this.colRange = rlist(indices.dim(1));
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
          return Promise.resolve(col);
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
    const col = this.colStratManager.columns.filter((d) => d.data.desc.id === sortData.col.data.desc.id);
    if (col.length === 0) {
      return;
    }
    col[0].sortCriteria = sortData.sortMethod;
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


  private async makeMatrixView(s) {

    //If there is zero and not matching columns return nothing
    if (s === undefined) {
      return;
    }
    this.matrixViews = [];
    for (const r of s) {
      const mergedRange = mergeRanges(this.rowRanges);
      let rowView = await this.data.idView(mergedRange);
      rowView = (<INumericalMatrix>rowView).t;

      let colView = await rowView.idView(r);
      colView = (<INumericalMatrix>colView).t;
      this.matrixViews.push(colView);
    }

  }


  private attachListener() {
    on(CategoricalColumn.EVENT_STRATIFYME, this.stratifyMe);
    const options = ['select', AGGREGATE.min, AGGREGATE.max, AGGREGATE.mean, AGGREGATE.median, AGGREGATE.q1, AGGREGATE.q3];
    const $vectorChange = this.toolbar.select('div.onHoverToolbar').append('select')
      .attr('class', 'aggSelect')
      .on('change', (d, i) => {
        const value = this.toolbar.select('div.onHoverToolbar').select('select').property('value');
        this.fire(MatrixColumn.EVENT_CONVERT_TO_VECTOR, this.matrixViews, value, this);
      });

    $vectorChange
      .selectAll('option')
      .data(options).enter()
      .append('option')
      .text((d) => d);

  }


}
