/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import {IDataType} from 'phovea_core/src/datatype';
import Range1D from 'phovea_core/src/range/Range1D';
import Range from 'phovea_core/src/range/Range';
import {EventHandler} from 'phovea_core/src/event';
import * as d3 from 'd3';
import {SORT} from '../SortEventHandler/SortEventHandler';
import AVectorFilter from '../filter/AVectorFilter';
export enum EOrientation {
  Horizontal,
  Vertical
}

abstract class AColumn<T, DATATYPE extends IDataType> extends EventHandler {
  static readonly EVENT_REMOVE_ME = 'removeMe';
  static readonly EVENT_COLUMN_LOCK_CHANGED = 'locked';

  $node:d3.Selection<any>;

  minimumWidth: number = 10;
  preferredWidth: number = 100;
  dataView: IDataType;
  sortCriteria: string = SORT.asc;

  constructor(public readonly data: DATATYPE, public readonly orientation: EOrientation) {
    super();
  }

  get idtype() {
    return this.data.idtypes[0];
  }

  abstract layout(width: number, height: number);

  abstract async update(idRange: Range): Promise<any>;


  getVerticalMargin() {
    return {top: 0, bottom: 0};
  }

  get body() {
    return this.$node.select('main');
  }

  get header() {
    return this.$node.select('header.columnHeader');
  }

  protected get toolbar() {
    return this.$node.select('div.toolbar');
  }

  // async updateMatrix(rowRange, colRange) {
  //   return rowRange;
  // }

  async updateMatrixCol(colRange) {
    return colRange;
  }

  protected build(parent: HTMLElement) {
    this.$node = d3.select(parent).select('.columnList')
      .append('li')
      .classed('column', true)
      .classed('column-' + (this.orientation === EOrientation.Horizontal ? 'hor' : 'ver'), true)
      .style('min-width', this.minimumWidth + 'px')
      .style('width', this.preferredWidth + 'px')
      .html(`
        <header class="columnHeader">
          <div class="toolbar"></div>
          <span>${this.data.desc.name}</span>
        </header>
        <main></main>`);

    const header = this.$node.selectAll('header')
      .on('mouseover', function () {
        d3.select(this).select('.toolbar').style('display', 'block');
      })
      .on('mouseleave', function () {
        d3.select(this).select('.toolbar').style('display', 'none');
      });

    this.buildBody(this.body);
    this.buildToolbar(this.toolbar);

    return this.$node;
  }

  protected abstract buildBody($body:d3.Selection<any>);

  protected buildToolbar($toolbar:d3.Selection<any>) {
    const $lockButton = $toolbar.append('button')
      .classed('fa fa-unlock', true)
      .on('click', () => {
        this.lockColumnWidth($lockButton);
      });

    $toolbar.append('button')
      .classed('fa fa-close', true)
      .on('click', () => {
        this.fire(AColumn.EVENT_REMOVE_ME);
        return false;
      });
  }

  protected lockColumnWidth($lockButton) {
    if ($lockButton.classed('fa-lock')) {
      // UNLOCKING
      $lockButton.attr('class', 'fa fa-unlock');
      this.fire(AColumn.EVENT_COLUMN_LOCK_CHANGED, 'unlocked');

      this.$node
        .classed('itemWidth', true)
        .classed('itemFixedWidth', false)
        .style('flex', `1 1 ${this.$node.property('clientWidth')}px`)
        //.style('width', `${this.$node.property('clientWidth')}px`)
        .style('min-width', `${this.minimumWidth}px`)
        .style('max-width', `${this.preferredWidth}px`);

    } else {
      // LOCKING
      $lockButton.attr('class', 'fa fa-lock');
      this.fire(AColumn.EVENT_COLUMN_LOCK_CHANGED, 'locked');

      this.$node
        .classed('itemFixedWidth', true)
        .classed('itemWidth', false)
        .style('flex', `0 0 ${this.$node.property('clientWidth')}px`);
        //.style('width', null)
        //.style('min-width', `${this.currentWidth}px`)
        //.style('min-width', null)
        //.style('max-width', `${this.currentWidth}px`);
    }
  }


}

export default AColumn;
