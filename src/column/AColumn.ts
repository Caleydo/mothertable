/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import {IDataType} from 'phovea_core/src/datatype';
import Range1D from 'phovea_core/src/range/Range1D';
import Range from 'phovea_core/src/range/Range';
import {EventHandler} from 'phovea_core/src/event';
import * as d3 from 'd3';
import {SORT} from '../SortHandler/SortHandler';
import AVectorFilter from '../filter/AVectorFilter';
import {formatAttributeName} from './utils';
export enum EOrientation {
  Horizontal,
  Vertical
}


abstract class AColumn<T, DATATYPE extends IDataType> extends EventHandler {
  static readonly EVENT_REMOVE_ME = 'removeMe';
  static readonly EVENT_COLUMN_LOCK_CHANGED = 'locked';
  static readonly DATATYPE = {vector: 'vector', matrix: 'matrix'};
  $node: d3.Selection<any>;

  minWidth: number = 10;
  maxWidth: number = 100;
  minHeight: number = 2;
  maxHeight: number = 10;
  lockedWidth: number = -1;
  activeVis: string;
  minimumHeight: number = 2;
  preferredHeight: number = 30;

  dataView: IDataType;
  sortCriteria: string = SORT.asc;
  rangeView: Range;
  multiformList = [];

  constructor(public readonly data: DATATYPE, public readonly orientation: EOrientation) {
    super();
  }

  get idtype() {
    return this.data.idtypes[0];
  }

  get body() {
    return this.$node.select(':scope > main'); // :scope = enforce direct children
  }

  get header() {
    return this.$node.select('header.columnHeader');
  }

  get toolbar() {
    return this.$node.select('header > .toolbar');
  }

  protected build($parent: d3.Selection<any>): d3.Selection<any> {
    if (this.orientation === EOrientation.Horizontal) {
      return this.buildHorizontal($parent);
    }
    return this.buildVertical($parent);
  }

  /**
   * Add template for stratifications columns (in the header )
   * @param $parent
   * @returns {Selection<any>}
   */
  protected buildVertical($parent: d3.Selection<any>): d3.Selection<any> {
    const $node = $parent.insert('li', 'li')
      .datum(this)
      .classed('column-strat', true)
      .classed('column-' + (this.orientation === EOrientation.Horizontal ? 'hor' : 'ver'), true)
      .html(`
        <header>
          <div class="labelName">${formatAttributeName(this.data.desc.name)}</div>
        </header> 
        <main></main>
      `);
    return $node;
  }

  /**
   * Add template for regular columns (in the main view)
   * @param $parent
   * @returns {Selection<any>}
   */
  protected buildHorizontal($parent: d3.Selection<any>): d3.Selection<any> {
    const $node = $parent
      .append('li')
      .datum(this)
      .classed('column', true)
      .classed('column-' + (this.orientation === EOrientation.Horizontal ? 'hor' : 'ver'), true)
      .style('min-width', this.minWidth + 'px')
      .style('width', this.maxWidth + 'px')
      .html(`
        <aside></aside>
        <header class="columnHeader">
          <div class="labelName">${formatAttributeName(this.data.desc.name)}</div>
          <div class="toolbar"></div>
        </header>
        <main></main>`);

    this.buildToolbar($node.select('div.toolbar'));

    return $node;
  }

  protected buildToolbar($toolbar: d3.Selection<any>) {
    const $lockButton = $toolbar.append('a')
      .attr('title', 'Lock column')
      .html(`<i class="fa fa-unlock fa-fw" aria-hidden="true"></i><span class="sr-only">Lock column</span>`)
      .on('click', () => {
        this.lockColumnWidth($lockButton);
      });

    $toolbar.append('a')
      .attr('title', 'Remove column')
      .html(`<i class="fa fa-trash fa-fw" aria-hidden="true"></i><span class="sr-only">Remove column</span>`)
      .on('click', () => {
        this.fire(AColumn.EVENT_REMOVE_ME);
        return false;
      });
  }

  async updateMultiForms(rowRanges: Range[]) {
    // hook
  }

  protected lockColumnWidth($lockButton) {
    if ($lockButton.select('i').classed('fa-lock')) {
      // UNLOCKING
      $lockButton
        .classed('active', false)
        .attr('title', 'Lock column')
        .html(`<i class="fa fa-unlock fa-fw" aria-hidden="true"></i><span class="sr-only">Lock column</span>`);
      this.lockedWidth = -1;
      this.fire(AColumn.EVENT_COLUMN_LOCK_CHANGED, 'unlocked');

    } else {
      // LOCKING
      $lockButton
        .classed('active', true)
        .attr('title', 'Unlock column')
        .html(`<i class="fa fa-lock fa-fw" aria-hidden="true"></i><span class="sr-only">Unlock column</span>`);
      this.lockedWidth = this.$node.property('clientWidth');
      this.fire(AColumn.EVENT_COLUMN_LOCK_CHANGED, 'locked');
    }
  }


}

export default AColumn;
