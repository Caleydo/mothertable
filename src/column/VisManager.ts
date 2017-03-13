/**
 * Created by Katarína Furmanová on 13.03.2017.
 */
import MultiForm from 'phovea_core/src/multiform/MultiForm';
import {IVisPluginDesc} from '../../../phovea_core/src/vis';
import {IMotherTableType} from './ColumnManager';
import {IStringVector} from './AVectorColumn';
import {INumericalVector, ICategoricalVector} from '../../../phovea_core/src/vector/IVector';
import {INumericalMatrix} from '../../../phovea_core/src/matrix/IMatrix';
import {
  VALUE_TYPE_CATEGORICAL, VALUE_TYPE_INT, VALUE_TYPE_REAL,
  VALUE_TYPE_STRING
} from '../../../phovea_core/src/datatype';


export interface VisOptions {
  /**
   * Minimal Width
   * @default 20
   */
  minWidth?: number;
  /**
   * Minimal Height
   * @default 10
   */
  minHeight?: number;
  /**
   * Maximal Width
   * @default 50
   */
  maxWidth?: number;
  /**
   * Maximal Height
   * @default 100
   */
  maxHeight?: number;
  /**
   * Minimal Row Height
   * @default 2
   */
  rowMinHeight?: number;
  /**
   * Maximal Row Height
   * @default 10
   */
  rowMaxHeight?: number;
  /**
   * Minimal Column Width
   * @default 2
   */
  columnMinWidth?: number;
  /**
   * Maximal Column Width
   * @default 10
   */
  columnMaxWidth?: number;
}


export default class VisManager {

  private readonly stringOptions: VisOptions = {
    rowMinHeight: 19,
    rowMaxHeight: 25,
    columnMinWidth: 10,
    columnMaxWidth: 100,
    minWidth: 20,
    maxWidth: 100
  };
  private readonly barplotOptions: VisOptions = {
    rowMinHeight: 2,
    rowMaxHeight: 10,
    minWidth: 20,
    maxWidth: 50
  };
  private readonly heatmap1DOptions: VisOptions = {
    rowMinHeight: 2,
    rowMaxHeight: 10,
    minWidth: 20,
    maxWidth: 50
  };
  private readonly heatmapOptions: VisOptions = {
    rowMinHeight: 2,
    rowMaxHeight: 10,
    columnMinWidth: 2,
    columnMaxWidth: 10
  };
  private readonly boxplotOptions: VisOptions = {
    minHeight: 10,
    maxHeight: 50,
    minWidth: 20,
    maxWidth: 50
  };
  private readonly histogramOptions: VisOptions = {
    minHeight: 20,
    maxHeight: 50,
    minWidth: 20,
    maxWidth: 20
  };
  private readonly mosaicOptions: VisOptions = {
    rowMinHeight: 2,
    rowMaxHeight: 10,
    minWidth: 20,
    maxWidth: 50
  };

  private readonly vissesOptions: {[id : string] : VisOptions};

  /**
   *User selected visualization for multiform with given id
   */
  public userSelectedVisses: {[id : number] : IVisPluginDesc} = {};

  constructor(){
    this.vissesOptions = {
      'table' : this.stringOptions,
      'barplot': this.barplotOptions,
      'list': this.stringOptions,
      'phovea-vis-heatmap1d': this.heatmap1DOptions,
      'phovea-vis-heatmap': this.heatmapOptions,
      'phovea-vis-histogram': this.histogramOptions,
      'phovea-vis-mosaic': this.mosaicOptions,
      'phovea-vis-box': this.boxplotOptions
    };
  }

  static getDefaultVis(columnType: string, dataType: string){
    switch(columnType){
      case 'vector':
        switch(dataType) {
          case VALUE_TYPE_STRING:
            return 'list';
          case VALUE_TYPE_INT || VALUE_TYPE_REAL:
            return 'barplot';
          case VALUE_TYPE_CATEGORICAL:
            return 'phovea-vis-heatmap1d';
          default:
            return 'table';
        }
      case 'matrix':
        return 'phovea-vis-heatmap';
      default:
        return 'table'
    }
  }

  assignVis(multiform: MultiForm, width: number, height: number) {
    const visses:IVisPluginDesc[] = multiform.visses;
    if(multiform.id in this.userSelectedVisses){
      multiform.switchTo(this.userSelectedVisses[multiform.id]);
      //TODO Scale to required size
    }else{
      const preferredVis = VisManager.getDefaultVis(multiform.data.desc.type, multiform.data.desc.value.type);
      let minPreferredVisHeight = 50;
      let minPreferredVisWidth = 20;
      switch(preferredVis) {
        case ("table"):
            minPreferredVisHeight = (multiform.data.dim[0] + 1) * this.vissesOptions[preferredVis].rowMinHeight;
            minPreferredVisWidth = (multiform.data.dim[1] + 1) * this.vissesOptions[preferredVis].columnMinWidth;
            break;
        case ("list"):
            minPreferredVisHeight = multiform.data.dim[0] * this.vissesOptions[preferredVis].rowMinHeight;
            minPreferredVisWidth = this.vissesOptions[preferredVis].minWidth;
            break;
        case ("barplot"):
            minPreferredVisHeight = multiform.data.dim[0] * this.vissesOptions[preferredVis].rowMinHeight;
            minPreferredVisWidth = this.vissesOptions[preferredVis].minWidth;
            break;
        case ("phovea-vis-heatmap1d"):
            minPreferredVisHeight = multiform.data.dim[0] * this.vissesOptions[preferredVis].rowMinHeight;
            minPreferredVisWidth = this.vissesOptions[preferredVis].minWidth;
            break;
        case ("phovea-vis-heatmap"):
            minPreferredVisHeight = multiform.data.dim[0] * this.vissesOptions[preferredVis].rowMinHeight;
            minPreferredVisWidth = (multiform.data.dim[1] + 1) * this.vissesOptions[preferredVis].columnMinWidth;
            break;
      }

      if(!((minPreferredVisHeight <= height) && (minPreferredVisWidth <= width))){
        visses.forEach((v) => {
          if(v.id == 'phovea-vis-histogram'){
            multiform.switchTo(v);
          }
        });
      }else{
        multiform.switchTo(preferredVis);
      }
    }
  }
}



