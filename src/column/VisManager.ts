/**
 * Created by Katarína Furmanová on 13.03.2017.
 */
import MultiForm from 'phovea_core/src/multiform/MultiForm';
import {IVisPluginDesc} from 'phovea_core/src/vis';
import {IMotherTableType, AnyColumn} from './ColumnManager';

import {
  VALUE_TYPE_CATEGORICAL, VALUE_TYPE_INT, VALUE_TYPE_REAL,
  VALUE_TYPE_STRING
} from 'phovea_core/src/datatype';


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
    rowMaxHeight: 25,
    minWidth: 40,
    maxWidth: 50
  };
  private readonly heatmap1DOptions: VisOptions = {
    rowMinHeight: 2,
    rowMaxHeight: 25,
    minWidth: 20,
    maxWidth: 50
  };
  private readonly heatmapOptions: VisOptions = {
    rowMinHeight: 2,
    rowMaxHeight: 25,
    columnMinWidth: 2,
    columnMaxWidth: 10
  };
  private readonly boxplotOptions: VisOptions = {
    minHeight: 10,
    maxHeight: 50,
    minWidth: 20,
    maxWidth: 50
  };
  private readonly propSymbolOptions: VisOptions = {
    rowMinHeight: 10,
    rowMaxHeight: 25,
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
    rowMaxHeight: 25,
    minWidth: 20,
    maxWidth: 50
  };

  private readonly vissesOptions: {[id: string]: VisOptions};

  /**
   *User selected visualization for multiform with given id
   */
  public static userSelectedAggregatedVisses: {[id : string]: IVisPluginDesc} = {};
  public static userSelectedUnaggregatedVisses: {[id : string]: IVisPluginDesc} = {};

  public static aggregationType = {
    AGGREGATED : 1,
    UNAGGREGATED : 2,
  };

  constructor() {
    this.vissesOptions = {
      'table': this.stringOptions,
      'barplot': this.barplotOptions,
      'list': this.stringOptions,
      'phovea-vis-heatmap1d': this.heatmap1DOptions,
      'phovea-vis-heatmap': this.heatmapOptions,
      'phovea-vis-histogram': this.histogramOptions,
      'phovea-vis-mosaic': this.mosaicOptions,
      'phovea-vis-box': this.boxplotOptions,
      'proportionalSymbol' : this.propSymbolOptions
    };
  }

  static getDefaultVis(columnType: string, dataType: string, aggregationType ) {
    switch(columnType){
      case 'vector':
        switch (dataType) {
          case VALUE_TYPE_STRING:
            return 'list';
          case VALUE_TYPE_INT || VALUE_TYPE_REAL:
            return 'barplot';
          case VALUE_TYPE_CATEGORICAL:
            return 'phovea-vis-heatmap1d';
          default:
            return 'list';
        }
      case 'matrix':
        return 'phovea-vis-heatmap';
      default:
        return 'list'
    }
  }

  static setUserVis(id:number, vis:IVisPluginDesc, aggregationType) {
    if(aggregationType == VisManager.aggregationType.AGGREGATED){
      VisManager.userSelectedAggregatedVisses[id] = vis;
    }else{
      VisManager.userSelectedUnaggregatedVisses[id] = vis;
    }

  }

  static updateUserVis(idOld:string, idNew:string, aggregationType) {
    if(aggregationType == VisManager.aggregationType.AGGREGATED){
      if(idOld in VisManager.userSelectedAggregatedVisses) {
        VisManager.userSelectedAggregatedVisses[idNew] = VisManager.userSelectedAggregatedVisses[idOld];
      }
    }else{
      if(idOld in VisManager.userSelectedUnaggregatedVisses) {
        VisManager.userSelectedUnaggregatedVisses[idNew] = VisManager.userSelectedUnaggregatedVisses[idOld];
      }
    }
  }

  static removeUserVisses(id:string) {
    delete VisManager.userSelectedAggregatedVisses[id];
    delete VisManager.userSelectedUnaggregatedVisses[id];
  }


  /*
   * Compute minimum height of column depending on
   * minimal size of user-selected visualizations and
   * minimal size of visualizations available for given datatype
   */
  computeMinHeight(col: AnyColumn): number [] {
    let minColumnHeight: number[] = [];
    col.multiformList.forEach((multiform, index) => {
      let minHeight;
      if(multiform.id in VisManager.userSelectedAggregatedVisses) {
        minHeight = this.minVisSize(VisManager.userSelectedAggregatedVisses[multiform.id].id, multiform.data.dim)[1];
      }else if(multiform.id in VisManager.userSelectedUnaggregatedVisses) {
        minHeight = this.minVisSize(VisManager.userSelectedUnaggregatedVisses[multiform.id].id, multiform.data.dim)[1];
      }else{
        minHeight = Number.POSITIVE_INFINITY;
        const visses: IVisPluginDesc[] = multiform.visses;
        visses.forEach((v) => {
          let minHeightTmp = this.minVisSize(v.id, multiform.data.dim)[1];
          minHeight = (minHeight > minHeightTmp) ? minHeightTmp : minHeight;
        });
      }
      minColumnHeight.push(minHeight);
    });
    return minColumnHeight;
  }


  minVisSize(vis: string, dims: number[]): number[] {
    let minVisHeight;
    let minVisWidth;
    switch (vis) {
      case ('table'):
        minVisHeight = (dims[0] + 1) * this.vissesOptions[vis].rowMinHeight;
        minVisWidth = ((dims[1] + 1) || 1) * this.vissesOptions[vis].columnMinWidth;
        break;
      case ('list'):
        minVisHeight = dims[0] * this.vissesOptions[vis].rowMinHeight;
        minVisWidth = this.vissesOptions[vis].minWidth;
        break;
      case ('barplot'):
        minVisHeight = dims[0] * this.vissesOptions[vis].rowMinHeight;
        minVisWidth = this.vissesOptions[vis].minWidth;
        break;
      case ('phovea-vis-heatmap1d'):
        minVisHeight = dims[0] * this.vissesOptions[vis].rowMinHeight;
        minVisWidth = this.vissesOptions[vis].minWidth;
        break;
      case ('phovea-vis-heatmap'):
        minVisHeight = dims[0] * this.vissesOptions[vis].rowMinHeight;
        minVisWidth = (dims[1] || 1) * this.vissesOptions[vis].columnMinWidth;
        break;
      case ('phovea-vis-histogram'):
        minVisHeight = this.vissesOptions[vis].minHeight;
        minVisWidth = this.vissesOptions[vis].minWidth;
        break;
      case ('phovea-vis-box'):
        minVisHeight = this.vissesOptions[vis].minHeight;
        minVisWidth = this.vissesOptions[vis].minWidth;
        break;
      case ('phovea-vis-mosaic'):
        //TODO correct mosaic height
        minVisHeight = dims[0] * this.vissesOptions[vis].rowMinHeight;
        minVisWidth = this.vissesOptions[vis].minWidth;
        break;
      default:
        minVisHeight = 50;
        minVisWidth = 20;
    }
    return [minVisWidth, minVisHeight];
  }


  assignVis(multiform: MultiForm, width: number, height: number) {
    const visses:IVisPluginDesc[] = multiform.visses;
    if(multiform.id in VisManager.userSelectedAggregatedVisses){//TODO add check if it should be aggregated or not
      multiform.switchTo(VisManager.userSelectedAggregatedVisses[multiform.id]);
      //TODO Scale to required size
    }else if(multiform.id in VisManager.userSelectedUnaggregatedVisses) {//TODO add check if it should be aggregated or not
       multiform.switchTo(VisManager.userSelectedUnaggregatedVisses[multiform.id]);
    }else{
      const preferredVis = VisManager.getDefaultVis(multiform.data.desc.type, multiform.data.desc.value.type,VisManager.aggregationType.UNAGGREGATED);//TODO check agggregation type for multiform
      let minPreferredSize = this.minVisSize(preferredVis, multiform.data.dim);

      let visId;
      if (!((minPreferredSize[1] <= height) && (minPreferredSize[0] <= width))) {
        switch (multiform.data.desc.type) {
          case 'vector':
            switch(multiform.data.desc.value.type) {
                case VALUE_TYPE_STRING:
                  visId = 'list';
                  break;
                case VALUE_TYPE_INT || VALUE_TYPE_REAL:
                  if(minPreferredSize[0] > width){
                      visId = 'phovea-vis-heatmap1d';
                  }
                  break;
                case VALUE_TYPE_CATEGORICAL:
                    if(minPreferredSize[1] > height){
                      visId = 'phovea-vis-mosaic';
                    }
                  break;
                default:
                  visId = 'list';
                  break;
            }
            break;
            case 'matrix':
              visId = 'phovea-vis-heatmap';
              break;
            default:
              visId = 'list';
              break;
    }

        visses.forEach((v) => {
          if (v.id === visId) {
            multiform.switchTo(v);
          }
        });
      } else {
        multiform.switchTo(preferredVis);
      }
    }
  }
}



