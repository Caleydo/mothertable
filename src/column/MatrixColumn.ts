/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import AColumn, {EOrientation} from './AColumn';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {MultiForm, IMultiFormOptions} from 'phovea_core/src/multiform';
import {IDataType} from 'phovea_core/src/datatype';
import Range from 'phovea_core/src/range/Range';
import {list as rlist} from 'phovea_core/src/range';
import {scaleTo, NUMERICAL_COLOR_MAP, makeListFromRange} from './utils';
import {createColumn, AnyColumn, IMotherTableType} from './ColumnManager';
import * as d3 from 'd3';
import VisManager from './VisManager';
import AColumnManager from './AColumnManager';
import {AnyFilter, default as AFilter} from '../filter/AFilter';
import {EAggregationType} from './VisManager';
import TaggleMultiform from './TaggleMultiform';
import {AVectorFilter} from '../filter/AVectorFilter';
import {on} from 'phovea_core/src/event';
import {INumericalVector} from "phovea_core/src/vector/IVector";
import {AVectorColumn} from './AVectorColumn';

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
  private colRange: Range;
  dataView: IDataType;
  multiformList: TaggleMultiform[] = [];

  private $colStrat: d3.Selection<any>;
  private colStratManager: AColumnManager = new AColumnManager();
  public static EVENT_CONVERT_TO_VECTOR = 'convertMatrix';

  constructor(data: INumericalMatrix, orientation: EOrientation, $columnParent: d3.Selection<any>) {
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
    this.stratifiedRanges = stratifiedRanges;
    this.brushedRanges = brushedRanges;

    if (!rowRanges) {
      rowRanges = this.rowRanges;
    }
    this.rowRanges = rowRanges;

    if (!colRange) {
      colRange = (await this.calculateDefaultRange());
      this.colRange = colRange;
    }
    this.colRange = colRange;
    const viewPromises = rowRanges.map((r) => {
      return this.data.idView(r)
        .then((rowView) => (<INumericalMatrix>rowView).t)
        .then((rowViewMatrix) => rowViewMatrix.idView(colRange))
        .then((colView) => (<INumericalMatrix>colView).t);
    });

    return Promise.all(viewPromises).then((views) => {
      this.body.selectAll('.multiformList').remove();
      this.multiformList = [];

      views.forEach((view, id) => {
        const $multiformDivs = this.body.append('div').classed('multiformList', true);

        const m = new TaggleMultiform(view, <HTMLElement>$multiformDivs.node(), this.multiFormParams($multiformDivs));
        m.groupId = this.findGroupId(stratifiedRanges, rowRanges[id]);
        m.brushed = this.checkBrushed(brushedRanges, rowRanges[id]);

        //assign visses
        if (this.selectedAggVis) {
          VisManager.userSelectedAggregatedVisses.set(m.id, this.selectedAggVis);
        }
        if (this.selectedUnaggVis) {
          VisManager.userSelectedUnaggregatedVisses.set(m.id, this.selectedUnaggVis);
        }
        VisManager.multiformAggregationType.set(m.id, EAggregationType.UNAGGREGATED);

        this.multiformList.push(m);
      });

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
    const col = createColumn(data, EOrientation.Horizontal, this.$colStrat);
    this.colStratManager.add(col);
    return Promise.resolve(col);
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async updateColStrats() {
    const rangeListMap: Map<string, Range[]> = await this.colStratManager.sort();
    this.colRange = this.colStratManager.nonStratifiedRange;
    this.updateMultiForms(this.rowRanges, this.stratifiedRanges, this.brushedRanges, this.colRange);
    this.colStratManager.stratify(rangeListMap);
  }

  filterStratData(range: Range) {
    this.colStratManager.filter(range);
    this.updateColStrats();
  }

  sortByFilterHeader(sortData) {
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



  private attachListener() {
    const $vectorChange = this.toolbar.insert('a', ':first-child')
      .attr('title', 'Aggregated Me')
      .html(`<i class="fa fa-exchange" aria-hidden="true"></i><span class="sr-only">Aggregate Me</span>`);

    $vectorChange.on('click', () => {
      this.fire(MatrixColumn.EVENT_CONVERT_TO_VECTOR, this);
    });

  }


}
