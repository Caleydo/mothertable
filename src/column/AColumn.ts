/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import {IDataType} from 'phovea_core/src/datatype';
import Range1D from 'phovea_core/src/range/Range1D';
import {EventHandler} from 'phovea_core/src/event';
import * as d3 from 'd3';
import {SORT} from '../sortColumn/SortColumn';
import AVectorFilter from '../filter/AVectorFilter';
export enum EOrientation {
  Horizontal,
  Vertical
}

abstract class AColumn<T, DATATYPE extends IDataType> extends EventHandler {
  static readonly EVENT_REMOVE_ME = 'removeMe';
  static readonly EVENT_COLUMN_LOCK_CHANGED = 'locked';

  minimumWidth: number = 10;
  preferredWidth: number = 100;
  sortCriteria: string = SORT.asc;

  constructor(public readonly data: DATATYPE, public readonly orientation: EOrientation) {
    super();

  }

  get idtype() {
    return this.data.idtypes[0];
  }

  abstract readonly node: HTMLElement;

  abstract layout(width: number, height: number);

  abstract async update(idRange: Range1D): Promise<any>;


  getVerticalMargin() {
    return {top: 0, bottom: 0};
  }

  get body() {
    return <HTMLElement>this.node.querySelector('main');
  }


  get header() {
    return <HTMLElement>this.node.querySelector('header.columnHeader');
  }

  async updateMatrix(rowRange, colRange) {

    return rowRange;
  }


  protected get toolbar() {
    return <HTMLElement>this.node.querySelector('div.toolbar');
  }

  protected build(parent: HTMLElement) {
    const node = parent.ownerDocument.createElement('div');
    node.classList.add('column');
    node.classList.add('column-' + (this.orientation === EOrientation.Horizontal ? 'hor' : 'ver'));
    //assign column with a proper width
    node.style.minWidth = String(this.minimumWidth + 'px');
    node.style.width = String(this.preferredWidth + 'px');
    let name = this.data.desc.name;
    if (name.length > 6) {
      name = name.slice(0, 6) + '..';
    }

    node.innerHTML = `
        <header class="columnHeader">
               <div class="toolbar"></div>
            <span>${name}</span>
        </header>
        <main></main>`;

    parent.appendChild(node);

    const header = d3.selectAll('header')
      .on('mouseover', function () {
        d3.select(this).select('.toolbar')
          .style('display', 'block');
      })
      .on('mouseleave', function () {
        d3.select(this).select('.toolbar')
          .style('display', 'none');
      });


    this.buildBody(<HTMLElement>node.querySelector('main'));
    this.buildToolbar(<HTMLElement>node.querySelector('div.toolbar'));
    return node;
  }

  protected abstract buildBody(body: HTMLElement);

  protected buildToolbar(toolbar: HTMLElement) {
    toolbar.insertAdjacentHTML('beforeend', `<button class="fa fa-unlock"></button>`);
    const lockButton = toolbar.querySelector('button.fa-unlock');
    this.lockColumnWidth(lockButton);

    toolbar.insertAdjacentHTML('beforeend', `<button class="fa fa-close"></button>`);
    toolbar.querySelector('button.fa-close').addEventListener('click', () => {
      this.fire(AColumn.EVENT_REMOVE_ME);
      return false;
    });
  }

  protected lockColumnWidth(lockButton) {
    lockButton.addEventListener('click', () => {
      const b = d3.select(lockButton);
      if (b.classed('fa-lock')) {
        // UNLOCKING
        b.attr('class', 'fa fa-unlock');
        this.fire(AColumn.EVENT_COLUMN_LOCK_CHANGED, 'unlocked');

        this.node.classList.add('itemWidth');
        this.node.classList.remove('itemFixedWidth');
        this.node.style.flex = '1 1 ' + String(this.node.clientWidth + 'px');
        //this.node.style.width = String(this.node.clientWidth + 'px');
        this.node.style.minWidth = String(this.minimumWidth + 'px');
        this.node.style.maxWidth = String(this.preferredWidth + 'px');

      } else {
        // LOCKING
        b.attr('class', 'fa fa-lock');
        this.fire(AColumn.EVENT_COLUMN_LOCK_CHANGED, 'locked');

        this.node.classList.add('itemFixedWidth');
        this.node.classList.remove('itemWidth');
        this.node.style.flex = '0 0 ' + String(this.node.clientWidth + 'px');
        /*const currentWidth = String(this.node.clientWidth + 'px');
         this.node.style.minWidth = currentWidth;
         this.node.style.maxWidth = currentWidth;
         this.node.style.minWidth = null;
         this.node.style.width = null; */

      }
    });
  }


}

export default AColumn;
