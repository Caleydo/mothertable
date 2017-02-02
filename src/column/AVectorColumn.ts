import AColumn, {EOrientation} from './AColumn';
import {IVector} from 'phovea_core/src/vector';
import {IStringValueTypeDesc, IDataType} from 'phovea_core/src/datatype';
import Range1D from 'phovea_core/src/range/Range1D';
import {MultiForm, IMultiFormOptions} from 'phovea_core/src/multiform';
import {list as rlist} from 'phovea_core/src/range';
import {scaleTo} from './utils';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export declare type IStringVector = IVector<string, IStringValueTypeDesc>;

export abstract class AVectorColumn<T, DATATYPE extends IVector<T, any>> extends AColumn<T, DATATYPE> {
  protected multiform: MultiForm;

  constructor(data: DATATYPE, orientation: EOrientation) {
    super(data, orientation);
  }

  protected multiFormParams(): IMultiFormOptions {
    return {};
  }

  protected buildBody(body: HTMLElement) {
    this.multiform = new MultiForm(this.data, body, this.multiFormParams());
  }

  protected buildToolbar(toolbar: HTMLElement) {
    toolbar.insertAdjacentHTML('afterbegin', `<div class="vislist"></div>`);
    if (this.multiform) {
      const vislist = <HTMLElement>toolbar.querySelector('div.vislist');
      this.multiform.addIconVisChooser(vislist);
    }
    super.buildToolbar(toolbar);
  }

  private replaceMultiForm(data: IDataType, body: HTMLElement) {
    const m = new MultiForm(this.data, body, this.multiFormParams());
    const vislist = <HTMLElement>this.toolbar.querySelector('div.vislist');
    vislist.innerHTML = ''; // clear old
    this.multiform.addIconVisChooser(vislist);
    return m;
  }

  layout(width: number, height: number) {
    scaleTo(this.multiform, width, height, this.orientation);
  }

  update(idRange: Range1D) {
    this.multiform.destroy();
    this.data.idView(rlist(idRange)).then((view) => {
      this.multiform = this.replaceMultiForm(view, this.body);
    });
  }
}

export default AVectorColumn;
