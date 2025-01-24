import {
  Action,
  AnnotatorToolEnum,
  Image,
  MainLayoutState,
  RegionAllowedActions,
} from "../MainLayout/types";
import { ComponentType, FunctionComponent, useEffect, useReducer } from "react";
import Immutable, { ImmutableObject } from "seamless-immutable";

import type { KeypointsDefinition } from "../types/region-tools.ts";
import MainLayout from "../MainLayout";
import SettingsProvider from "../SettingsProvider";
import combineReducers from "./reducers/combine-reducers";
import generalReducer from "./reducers/general-reducer";
import getFromLocalStorage from "../utils/get-from-local-storage";
import historyHandler from "./reducers/history-handler";
import imageReducer from "./reducers/image-reducer";
import useEventCallback from "use-event-callback";
import { AutosegOptions } from "autoseg/webworker";

export type AnnotatorProps = {
  taskDescription?: string;
  allowedArea?: { x: number; y: number; w: number; h: number };
  regionTagList?: Array<string>;
  regionTagSingleSelection?: boolean;
  regionAllowedActions?: Partial<RegionAllowedActions>;
  regionClsList?: Array<string | { id: string; label: string; color: string }>;
  imageTagList?: Array<string>;
  imageClsList?: Array<string>;
  enabledTools?: Array<AnnotatorToolEnum>;
  selectedTool?: String;
  showTags?: boolean;
  selectedCls?: string;
  selectedImage?: string | number;
  images?: Array<Image>;
  showPointDistances?: boolean;
  pointDistancePrecision?: number;
  RegionEditLabel?: ComponentType<any> | FunctionComponent<any> | null;
  onExit: (state: MainLayoutState) => void;
  keypointDefinitions?: KeypointsDefinition;
  fullImageSegmentationMode?: boolean;
  autoSegmentationOptions?: AutosegOptions;
  hideHeader?: boolean;
  hideHeaderText?: boolean;
  hideNext?: boolean;
  hidePrev?: boolean;
  hideClone?: boolean;
  hideSettings?: boolean;
  hideFullScreen?: boolean;
  hideSave?: boolean;
  allowComments?: boolean;
  onNextImage?: (state: MainLayoutState) => void;
  onPrevImage?: (state: MainLayoutState) => void;
};

export const Annotator = ({
  images,
  allowedArea,
  selectedImage = images && images.length > 0 ? 0 : undefined,
  showPointDistances,
  pointDistancePrecision,
  showTags = getFromLocalStorage("showTags", true),
  selectedCls,
  enabledTools = [
    "select",
    "create-point",
    "create-box",
    "create-polygon",
    "create-line",
    "create-expanding-line",
    "show-mask",
  ],
  selectedTool = "create-box",
  regionTagSingleSelection = false,
  regionTagList = [],
  regionClsList = [],
  regionAllowedActions = {
    remove: true,
    lock: true,
    visibility: true,
  },
  imageTagList = [],
  imageClsList = [],
  taskDescription = "",
  fullImageSegmentationMode = false,
  RegionEditLabel,
  onExit,
  onNextImage,
  onPrevImage,
  autoSegmentationOptions = { type: "autoseg" },
  hideHeader,
  hideHeaderText,
  hideNext,
  hidePrev,
  hideClone,
  hideSettings,
  hideFullScreen,
  hideSave,
  allowComments,
}: AnnotatorProps) => {
  if (typeof selectedImage === "string") {
    //console.log("selected image: " + selectedImage);
    selectedImage = (images || []).findIndex(
      (img) => img.name === selectedImage
    );

    //console.log("selected image: " + selectedImage);
    //console.log("image count: " + images?.length);
    // console.log(
    //   "image src: " + JSON.stringify((images || [])[selectedImage].src)
    // );

    if (selectedImage === -1) selectedImage = undefined;
  }
  const combinedReducers = combineReducers(imageReducer, generalReducer) as (
    state: ImmutableObject<MainLayoutState>,
    action: Action
  ) => ImmutableObject<MainLayoutState>;

  const immutableState = Immutable({
    showTags,
    selectedCls,
    allowedArea,
    showPointDistances,
    pointDistancePrecision,
    selectedTool,
    fullImageSegmentationMode: fullImageSegmentationMode,
    autoSegmentationOptions,
    mode: null,
    taskDescription,
    showMask: true,
    labelImages: imageClsList.length > 0 || imageTagList.length > 0,
    regionClsList,
    regionTagList,
    regionTagSingleSelection,
    imageClsList,
    imageTagList,
    enabledTools,
    history: [],
    allowComments,
    regionAllowedActions: {
      remove: regionAllowedActions?.remove ?? true,
      lock: regionAllowedActions?.lock ?? true,
      visibility: regionAllowedActions?.visibility ?? true,
    },
    ...{
      selectedImage,
      images,
    },
  });
  const [state, dispatchToReducer] = useReducer<
    (state: MainLayoutState, action: Action) => MainLayoutState
  >(
    historyHandler(combinedReducers) as unknown as (
      state: MainLayoutState,
      action: Action
    ) => MainLayoutState,
    immutableState as unknown as MainLayoutState
  );

  const dispatch = useEventCallback((action: Action) => {
    if (action.type === "HEADER_BUTTON_CLICKED") {
      const value = (Immutable(state) as ImmutableObject<MainLayoutState>)
        .without("history")
        .asMutable({ deep: true });
      if (["Exit", "Done", "Save", "Complete"].includes(action.buttonName)) {
        return onExit(value);
      } else if (action.buttonName === "Next" && onNextImage) {
        return onNextImage(value);
      } else if (action.buttonName === "Prev" && onPrevImage) {
        return onPrevImage(value);
      }
    }
    dispatchToReducer(action);
  });

  const onRegionClassAdded = useEventCallback((cls) => {
    dispatchToReducer({
      type: "ON_CLS_ADDED",
      cls: cls,
    });
  });

  useEffect(() => {
    if (selectedImage === undefined) return;
    const image = state.images[selectedImage];
    dispatchToReducer({
      type: "SELECT_IMAGE",
      imageIndex: +selectedImage,
      image,
    });
    // @ts-ignore
  }, [selectedImage, state.images]);

  if (!images) return <div>Missing required "images"</div>;

  return (
    <SettingsProvider>
      <MainLayout
        RegionEditLabel={RegionEditLabel}
        alwaysShowNextButton={Boolean(onNextImage)}
        alwaysShowPrevButton={Boolean(onPrevImage)}
        state={state}
        dispatch={dispatch}
        onRegionClassAdded={onRegionClassAdded}
        hideHeader={hideHeader}
        hideHeaderText={hideHeaderText}
        hideNext={hideNext}
        hidePrev={hidePrev}
        hideClone={hideClone}
        hideSettings={hideSettings}
        hideFullScreen={hideFullScreen}
        hideSave={hideSave}
      />
    </SettingsProvider>
  );
};

export default Annotator;
