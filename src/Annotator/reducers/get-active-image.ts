import Immutable, { ImmutableObject } from "seamless-immutable";
import { Image, MainLayoutState } from "../../MainLayout/types";

export default (state: ImmutableObject<MainLayoutState>) => {
  let currentImageIndex: number | null = null;
  let pathToActiveImage: string[] = [];
  let activeImage: Image | null = null;
  currentImageIndex = state.selectedImage ?? null;
  if (currentImageIndex === -1 || currentImageIndex === null) {
    currentImageIndex = null;
    activeImage = null;
  } else {
    pathToActiveImage = ["images", currentImageIndex.toString()];
    activeImage = Immutable(state).getIn(pathToActiveImage);
  }
  return { currentImageIndex, pathToActiveImage, activeImage };
};
