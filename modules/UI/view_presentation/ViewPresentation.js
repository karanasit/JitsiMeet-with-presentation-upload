
import Logger from "jitsi-meet-logger";

import {
    createSharedVideoEvent as createEvent,
    sendAnalytics,
} from "../../../react/features/analytics";
import {
    participantJoined,
    participantLeft,
    pinParticipant,
} from "../../../react/features/base/participants";
import {
    dockToolbox,
    showToolbox,
} from "../../../react/features/toolbox/actions.web";
import { getToolboxHeight } from "../../../react/features/toolbox/functions.web";
import { YOUTUBE_PARTICIPANT_NAME } from "../../../react/features/presentation/constants";
import UIEvents from "../../../service/UI/UIEvents";
import UIUtil from "../util/UIUtil";
import Filmstrip from "../videolayout/Filmstrip";
import LargeContainer from "../videolayout/LargeContainer";
import VideoLayout from "../videolayout/VideoLayout";

const logger = Logger.getLogger(__filename);

export const SHARED_VIDEO_CONTAINER_TYPE = "sharedvideo";

/**
 * Example shared video link.
 * @type {string}
 */
//const defaultSharedVideoLink = "https://centos-om.pune.cdac.in/?username=";

/**
 * The dialog for user input (video link).
 * @type {null}
 */
let dialog = null;

/**
 * Default Presentation frame width.
 */
const DEFAULT_WIDTH = 750;

/**
 * Default Presentation frame height.
 */
const DEFAULT_HEIGHT = 550;
/**
 * Manager of view presentation.
 */

export default class ViewPresentationManager {
    /**
     *
     */
    constructor(emitter) {
        this.emitter = emitter;
        this.isViewPresentationShown = false;
        this.isPlayerAPILoaded = false;
    }

    /**
     * Indicates if the local user is the owner of the shared video.
     * @returns {*|boolean}
     */
    isSharedVideoOwner() {
        return this.from && APP.conference.isLocalId(this.from);
    }

    /**
     * Starts shared video by asking user for url, or if its already working
     * asks whether the user wants to stop sharing the video.
     */
    toggleViewPresentation() {
        if (dialog) {
            return;
        }

        if (!this.isViewPresentationShown) {
            requestVideoLink().then(
                (url) => {
                    this.emitter.emit(
                        UIEvents.UPDATE_VIEW_PRESENTATION,
                        url,
                        "open"
                    );
                    sendAnalytics(createEvent("started"));
                },
                (err) => {
                    logger.log("VIEW PRESENTATION CANCELED", err);
                    sendAnalytics(createEvent("canceled"));
                }
            );

            return;
        }

        if (APP.conference.isLocalId(this.from)) {
            showStopPresentationPropmpt().then(
                () => {
                    this.emitter.emit(
                        UIEvents.UPDATE_VIEW_PRESENTATION,
                        this.url,
                        "closed"
                    );
                    sendAnalytics(createEvent("stopped"));
                },
                () => {}
            );
        } else {
            APP.UI.messageHandler.showWarning({
                descriptionKey: "dialog.alreadySharedPresentationMsg",
                titleKey: "dialog.alreadySharedPresentationTitle",
            });
            sendAnalytics(createEvent("already.shared"));
        }
    }


    onViewPresentationStart(id, url, attributes) {
        if (this.isViewPresentationShown) {
            return;
        }

        this.isViewPresentationShown = true;

        // the video url
        this.url = url;

        // the owner of the video
        this.from = id;

        this.initialAttributes = attributes;

        const self = this;

        if (self.isPlayerAPILoaded) {
            console.log("Already Loaded");
            loadIframeForPresentation();
        } else {
            loadIframeForPresentation();
        }

        function loadIframeForPresentation() {
            self.isPlayerAPILoaded = true;
            var meetinguRL = window.location.href;
            var splitedmeetinguRL = meetinguRL.split("/");
            var meetingName = splitedmeetinguRL[3];
            self.viewpresentation = new ViewPresentationContainer({
                url,
                id,
                meetingName,
            });

            if (!APP.conference.isLocalId(self.from)) {
                $("#sharedVideo").css("pointer-events", "none");
            }

            VideoLayout.addLargeVideoContainer(
                SHARED_VIDEO_CONTAINER_TYPE,
                self.viewpresentation
            );

            APP.store.dispatch(
                participantJoined({
  
                    conference: APP.conference._room,
                    id: self.url,
                    isFakeParticipant: true,
                    name: YOUTUBE_PARTICIPANT_NAME,
                })
            );

            APP.store.dispatch(pinParticipant(self.url));
            
        } 
    }


    onViewPresentationUpdate(id, url, attributes) {
        // if we are sending the event ignore
        if (APP.conference.isLocalId(this.from)) {
            return;
        }

        if (!this.isViewPresentationShown) {
            this.onViewPresentationStart(id, url, attributes);

            return;
        }
    }

    onViewPresentationStop(id, attributes) {
        if (!this.isViewPresentationShown) {
            return;
        }

        if (this.from !== id) {
            return;
        }

        APP.store.dispatch(participantLeft(this.url, APP.conference._room));

        VideoLayout.showLargeVideoContainer(
            SHARED_VIDEO_CONTAINER_TYPE,
            false
        ).then(
            () => {
                VideoLayout.removeLargeVideoContainer(
                    SHARED_VIDEO_CONTAINER_TYPE
                );

                $("#sharedVideoIFrame").css("pointer-events", "auto");

                this.emitter.emit(
                    UIEvents.UPDATE_VIEW_PRESENTATION,
                    null,
                    "removed"
                );
            },
            () => {}
        );

        this.url = null;
        this.isViewPresentationShown = false;
        this.initialAttributes = null;
    }
}

/**
 * Container for presentation view iframe.
 */
class ViewPresentationContainer extends LargeContainer {
    /**
     *
     */
    constructor({ url, id, meetingName }) {
        super();
        const iframe = document.createElement("iframe");
        var url = url + "?meetingId=" + meetingName;
        iframe.id = "sharedVideoIFrame";
        iframe.src = url;
        iframe.width = DEFAULT_WIDTH;
        iframe.height = DEFAULT_HEIGHT;
        this.container.appendChild(iframe);
        this.iframe = iframe;
    }

    get container() {
        return document.getElementById("sharedVideoIFrame");
    }

    /**
     *
     */
    show() {
        //const self = this;
        const $iframe = $(this.iframe);
        const $container = $(this.container);
        const self = this;

        return new Promise((resolve) => {
            $iframe.fadeIn(300, () => {
                self.bodyBackground = document.body.style.background;
                document.body.style.background = "black";
                $iframe.css({ opacity: 1 });
                APP.store.dispatch(dockToolbox(true));
                resolve();
            });
        });
    }

    /**
     *
     */
    hide() {
        const self = this;
        const $iframe = $(this.iframe);

        APP.store.dispatch(dockToolbox(false));

        return new Promise((resolve) => {
            $iframe.fadeOut(300, () => {
                document.body.style.background = self.bodyBackground;
                $iframe.css({ opacity: 0 });
                resolve();
            });
        });
    }

    /**
     *
     */
    onHoverIn() {
        APP.store.dispatch(showToolbox());
    }

    /**
     *
     */
    get id() {
        return this.url;
    }

    /**
     *
     */
    resize(containerWidth, containerHeight) {
        let height, width;

        if (interfaceConfig.VERTICAL_FILMSTRIP) {
            height = containerHeight - getToolboxHeight();
            width = containerWidth - Filmstrip.getVerticalFilmstripWidth();
        } else {
            height = containerHeight - Filmstrip.getFilmstripHeight();
            width = containerWidth;
        }

        $(this.iframe).width(width).height(height);
    }

    /**
     * @return {boolean} do not switch on dominant speaker event if on stage.
     */
    stayOnStage() {
        return false;
    }
}

/**
 * Ask user if he want to close shared video.
 */
function showStopPresentationPropmpt() {
    return new Promise((resolve, reject) => {
        const submitFunction = function (e, v) {
            if (v) {
                resolve();
            } else {
                reject();
            }
        };

        const closeFunction = function () {
            dialog = null;
        };

        dialog = APP.UI.messageHandler.openTwoButtonDialog({
            titleKey: "dialog.removeSharedPresentationTitle",
            msgKey: "dialog.removeSharedPresentationMsg",
            leftButtonKey: "dialog.Remove",
            submitFunction,
            closeFunction,
        });
    });
}

/**
 * Ask user for shared video url to share with others.
 * Dialog validates client input to allow only youtube urls.
 */
function requestVideoLink() {
    const i18n = APP.translation;
    const cancelButton = i18n.generateTranslationHTML("dialog.Cancel");
    const shareButton = i18n.generateTranslationHTML("dialog.Share");
    const backButton = i18n.generateTranslationHTML("dialog.Back");
    const linkError = i18n.generateTranslationHTML(
        "dialog.shareVideoLinkError"
    );

    return new Promise((resolve, reject) => {
        dialog = APP.UI.messageHandler.openDialogWithStates(
            {
                state0: {
                    //titleKey: "dialog.sharePresentationTitle",
                    html: `<div>Are you sure you want to Share Presentation?</div><input name='sharedVideoUrl' type='hidden'
                    class='input-control'
                    data-i18n='[placeholder]defaultLink' value='https://jitsidemo.cdac.in/presentation/'
                    autofocus>`,
                    persistent: false,
                    buttons: [
                        { title: cancelButton, value: false },
                        { title: shareButton, value: true },
                    ],
                    focus: ":input:first",
                    defaultButton: 1,
                    submit(e, v, m, f) {
                        // eslint-disable-line max-params
                        e.preventDefault();
                        if (!v) {
                            reject("cancelled");
                            dialog.close();

                            return;
                        }
                        //document.getElementById('yorInputID').value = "Your Value";
                        const sharedVideoUrl = f.sharedVideoUrl;

                        if (!sharedVideoUrl) {
                            return;
                        }

                        const urlValue = encodeURI(
                            UIUtil.escapeHtml(sharedVideoUrl)
                        );
                        const yVideoId = urlValue;
                        // const yVideoId = getYoutubeLink(urlValue);

                        if (!yVideoId) {
                            dialog.goToState("state1");

                            return false;
                        }

                        resolve(yVideoId);
                        dialog.close();
                    },
                },

                state1: {
                    titleKey: "dialog.shareVideoTitle",
                    html: linkError,
                    persistent: false,
                    buttons: [
                        { title: cancelButton, value: false },
                        { title: backButton, value: true },
                    ],
                    focus: ":input:first",
                    defaultButton: 1,
                    submit(e, v) {
                        e.preventDefault();
                        if (v === 0) {
                            reject();
                            dialog.close();
                        } else {
                            dialog.goToState("state0");
                        }
                    },
                },
            },
            {
                close() {
                    dialog = null;
                },
            },
            {
           //     url: defaultSharedVideoLink,
            }
        );
    });
}
