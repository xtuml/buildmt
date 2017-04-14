/*  
 * ******************************************************************************
 *  Copyright (c) 2013 Oracle Corporation.
 * 
 *  All rights reserved. This program and the accompanying materials
 *  are made available under the terms of the Eclipse Public License v1.0
 *  which accompanies this distribution, and is available at
 *  http://www.eclipse.org/legal/epl-v10.html
 * 
 *  Contributors: 
 * 
 *     Winston Prakash
 *    
 * ******************************************************************************  
 */

jQuery.noConflict();

var images = [
    imageRoot + '/green-check.jpg',
    imageRoot + '/progressbar.gif',
    imageRoot + '/error.png',
    imageRoot + '/16x16/warning.png'
];

var pageInitialized = false;
var selectedTeam;
var selectedTeamName;

jQuery(document).ready(function() {

    //To avoid multiple fire of document.ready
    if (pageInitialized) {
        return;
    }
    pageInitialized = true;

    jQuery("#teamManagerTabs").tabs();
    jQuery("#teamAdminTabs").tabs();

    jQuery("#outerTabs tr").not(".header").hover(
            function() {
                jQuery(this).css("background", "#EEEDED");
            },
            function() {
                jQuery(this).css("background", "");
            }
    );

    if (jQuery("#selectableTeamList").length > 0) {
        jQuery("#selectableTeamList").selectable({
            selected: function(event, ui) {
                jQuery(ui.selected).siblings().removeClass("ui-selected");
                selectedTeam = jQuery(ui.selected);
                selectedTeamName = jQuery(selectedTeam).text();
                refreshTeamInfo(selectedTeamName);
            }
        });

        // select the first team, so that its details can be loaded
        selectSelectableElement(jQuery("#selectableTeamList"), jQuery("#selectableTeamList").children(":eq(0)"));
    }

    var createTeamButton = jQuery('#createTeamButton');
    createTeamButton.button();
    createTeamButton.unbind("click").click(function() {
        createTeamButtonAction();
    });

    var moveJobsButton = jQuery('#moveJobsButton');
    moveJobsButton.button();
    moveJobsButton.unbind("click").click(function() {
        moveJobsButtonAction();
    });

    var moveViewsButton = jQuery('#moveViewsButton');
    moveViewsButton.button();
    moveViewsButton.unbind("click").click(function() {
        moveViewsButtonAction();
    });

    var moveNodesButton = jQuery('#moveNodesButton');
    moveNodesButton.button();
    moveNodesButton.unbind("click").click(function() {
        moveNodesButtonAction();
    });

    // currentUserTeam is set by jelly
    refreshTeamInfo(currentUserTeam);

});

function refreshTeamInfo(teamName) {
    if (teamName !== undefined) {
        jQuery("#teamInfo").load('teams/' + teamName, function() {
            onTeamDetailsLoad();
        });
    }
}

function onTeamDetailsLoad() {

    jQuery("#teamAdminTabs").tabs();

    jQuery('#teamInfo button.teamDeleteButton').each(function() {
        jQuery(this).button();
        jQuery(this).addClass('redButton');
        jQuery(this).unbind("click").click(function() {
            deleteTeamButtonAction(this);
        });
    });

    jQuery('#teamInfo button.teamMemberAddButton').each(function() {
        jQuery(this).button();
        jQuery(this).unbind("click").click(function() {
            teamMemberAddButtonAction(jQuery(this).val());
        });
    });

    jQuery('#teamInfo img.teamMemberUpdate').each(function() {
        jQuery(this).unbind("click").click(function() {
            updateTeamMemberAction(this);
        });
    });

    jQuery('#teamInfo img.teamMemberRemove').each(function() {
        jQuery(this).unbind("click").click(function() {
            removeTeamMemberAction(this);
        });
    });

    jQuery('#teamInfo img.configureJobVisibility').each(function() {
        jQuery(this).unbind("click").click(function() {
            configureJobVisibilityAction(this);
        });
    });

    jQuery('#teamInfo img.configureViewVisibility').each(function() {
        jQuery(this).unbind("click").click(function() {
            configureViewVisibilityAction(this);
        });
    });

    jQuery('#teamInfo img.configurePrimaryView').each(function() {
        jQuery(this).unbind("click").click(function() {
            setPrimaryViewAction(this);
        });
    });

    jQuery('#teamInfo img.configureNodeVisibility').each(function() {
        jQuery(this).unbind("click").click(function() {
            configureNodeVisibilityAction(this);
        });
    });

    jQuery('#teamInfo img.configureVisibleNodeEnable').each(function() {
        jQuery(this).unbind("click").click(function() {
            configureVisibleNodeEnableAction(this);
        });
    });

    jQuery('#teamMemberTab tr').each(function() {
        verifySid(this);
    });
}

function selectSelectableElement(selectableContainer, elementToSelect) {
    jQuery("li", selectableContainer).each(function() {
        if (this != elementToSelect[0]) {
            jQuery(this).removeClass("ui-selected").addClass("ui-unselecting");
        }
    });
    elementToSelect.addClass("ui-selecting");
    selectableContainer.data("selectable")._mouseStop(null);
}

function  createTeamButtonAction() {
    jQuery("#teamDesc").attr('value', "");
    clearMessage(jQuery('#teamAddMsg'));
    jQuery('#dialog-create-team').dialog({
        resizable: false,
        //height: 250,
        autoResize: true,
        width: 600,
        modal: true,
        buttons: {
            'Create': function() {
                var teamName = jQuery.trim(jQuery("#teamName").val());
                var teamDesc = jQuery("#teamDesc").val();
                var teamFolder = jQuery("#teamCustomFolder").val();
                if (!/^[-_a-zA-Z0-9]+$/.test(teamName)) {
                    showMessage("Only alphanumeric characters, - or _ allowed in team name.", true, jQuery('#teamAddMsg'));
                } else if (teamName.length > 64) {
                    // Must be same as Hudson.TEAM_NAME_LIMIT
                    showMessage("Team name may not exceed 64 characters.", true, jQuery('#teamAddMsg'));
                } else {
                    createTeam(teamName, jQuery.trim(teamDesc), jQuery.trim(teamFolder));
                }
            },
            Cancel: function() {
                jQuery(this).dialog("close");
            }
        }
    });
}

function createTeam(teamName, teamDesc, teamFolder) {
    jQuery.ajax({
        type: 'POST',
        url: "createTeam",
        data: {
            teamName: teamName,
            description: teamDesc,
            customFolder: teamFolder
        },
        success: function(result) {
            jQuery("#noTeamsMsg").hide();
            jQuery("#teamInfo").show();
            jQuery("#teamList").show();
            var teamItem = jQuery('<li class="ui-widget-content" title="' + teamName + '">' + teamName + '</li>');
            jQuery(teamItem).appendTo(jQuery('#selectableTeamList'));
            jQuery('#dialog-create-team').dialog("close");
            refreshTeamInfo(teamName);
            selectSelectableElement(jQuery("#selectableTeamList"), jQuery("#selectableTeamList li:last-child"));
        },
        error: function(msg) {
            showMessage(msg.responseText, true, jQuery('#teamAddMsg'));
        }
    });
}

function  deleteTeamButtonAction(deleteButton) {
    clearMessage(jQuery('#teamDeleteMsg'));
    var teamName = jQuery(deleteButton).val();
    jQuery('#dialog-delete-team').dialog({
        resizable: false,
        //height: 150,
        autoResize: true,
        width: 450,
        modal: true,
        title: "Delete Team - " + teamName,
        buttons: {
            'Delete': function() {
                deleteTeam(deleteButton);
            },
            Cancel: function() {
                jQuery(this).dialog("close");
            }
        }
    });
}

function deleteTeam(deleteButton) {
    var teamName = jQuery(deleteButton).val();
    jQuery.ajax({
        type: 'POST',
        url: "deleteTeam",
        data: {
            teamName: teamName
        },
        success: function(result) {
            var nextSelectable = jQuery(selectedTeam).next();
            if (nextSelectable.length === 0) {
                nextSelectable = jQuery(selectedTeam).prev();
            }
            jQuery(selectedTeam).remove();
            if (nextSelectable.length > 0) {
                //selectSelectableElement(jQuery("#selectableTeamList"), jQuery("#selectableTeamList li:first-child"));
                selectSelectableElement(jQuery("#selectableTeamList"), jQuery(nextSelectable));
            } else {
                jQuery("#noTeamsMsg").show();
                jQuery("#teamInfo").hide();
                jQuery("#teamList").hide();
            }
            jQuery('#dialog-delete-team').dialog("close");
        },
        error: function(msg) {
            showMessage(msg.responseText, true, jQuery('#teamDeleteMsg'));
        }
    });
}

function teamMemberAddButtonAction(teamName) {
    clearMessage(jQuery('#userAddMsg'));
    jQuery("#cb_adminFlag").prop('checked', false);
    jQuery("#cb_createFlag").prop('checked', true);
    jQuery("#cb_deleteFlag").prop('checked', true);
    jQuery("#cb_configureFlag").prop('checked', true);
    jQuery("#cb_buildFlag").prop('checked', true);

    jQuery("#cb_viewCreateFlag").prop('checked', false);
    jQuery("#cb_viewDeleteFlag").prop('checked', false);
    jQuery("#cb_viewConfigureFlag").prop('checked', false);

    jQuery("#cb_nodeCreateFlag").prop('checked', false);
    jQuery("#cb_nodeDeleteFlag").prop('checked', false);
    jQuery("#cb_nodeConfigureFlag").prop('checked', false);

    jQuery("#text_sidName").show();
    jQuery("#label_sidName").hide();
    jQuery('#dialog-add-modify-user').dialog({
        resizable: false,
        autoResize: true,
//      height: 300,
        width: 450,
        modal: true,
        title: "Add Team Member",
        buttons: {
            'Add': function() {
                var sid = jQuery("#text_sidName").val();
                var adminFlag = jQuery("#cb_adminFlag").is(':checked');
                var createFlag = jQuery("#cb_createFlag").is(':checked');
                var deleteFlag = jQuery("#cb_deleteFlag").is(':checked');
                var configureFlag = jQuery("#cb_configureFlag").is(':checked');
                var buildFlag = jQuery("#cb_buildFlag").is(':checked');
                var viewCreateFlag = jQuery("#cb_viewCreateFlag").is(':checked');
                var viewDeleteFlag = jQuery("#cb_viewDeleteFlag").is(':checked');
                var viewConfigureFlag = jQuery("#cb_viewConfigureFlag").is(':checked');
                var nodeCreateFlag = jQuery("#cb_nodeCreateFlag").is(':checked');
                var nodeDeleteFlag = jQuery("#cb_nodeDeleteFlag").is(':checked');
                var nodeConfigureFlag = jQuery("#cb_nodeConfigureFlag").is(':checked');
                addTeamMember(teamName, sid, adminFlag, createFlag, deleteFlag, configureFlag, buildFlag,
                        viewCreateFlag, viewDeleteFlag, viewConfigureFlag, nodeCreateFlag, nodeDeleteFlag, nodeConfigureFlag);
            },
            Cancel: function() {
                jQuery(this).dialog("close");
            }
        }
    });
}

function addTeamMember(teamName, member, adminFlag, createFlag, deleteFlag, configureFlag, buildFlag,
        viewCreateFlag, viewDeleteFlag, viewConfigureFlag, nodeCreateFlag, nodeDeleteFlag, nodeConfigureFlag) {
    jQuery.ajax({
        type: 'POST',
        url: "addTeamMember",
        data: {
            teamName: teamName,
            teamMemberSid: member,
            isTeamAdmin: adminFlag,
            canCreate: createFlag,
            canDelete: deleteFlag,
            canConfigure: configureFlag,
            canBuild: buildFlag,
            canCreateNode: nodeCreateFlag,
            canDeleteNode: nodeDeleteFlag,
            canConfigureNode: nodeConfigureFlag,
            canCreateView: viewCreateFlag,
            canDeleteView: viewDeleteFlag,
            canConfigureView: viewConfigureFlag
        },
        success: function(iconNameResponse) {
            jQuery('#teamMemberNone_' + teamName).remove();
            jQuery('#teamMemberListHeader1_' + teamName).css('visibility', 'visible');
            jQuery('#teamMemberListHeader2_' + teamName).css('visibility', 'visible');

            var userTemplate = jQuery("#userTemplate tr").clone();
            jQuery("input[name='hiddenUserName']", userTemplate).attr("value", member);
            jQuery("input[name='hiddenTeamName']", userTemplate).attr("value", teamName);
            var icon = jQuery(userTemplate).find("img[name='typeIcon']");
            jQuery(icon).attr("src", imageRoot + "/16x16/" + iconNameResponse);
            jQuery("span", userTemplate).text(member);

            setIconVisibility(userTemplate, "adminIcon", adminFlag);
            if (adminFlag) {
                createFlag = deleteFlag = configureFlag = buildFlag = viewCreateFlag =
                        viewDeleteFlag = viewConfigureFlag = nodeCreateFlag = nodeDeleteFlag = nodeConfigureFlag = true;
            }
            setIconVisibility(userTemplate, "createIcon", createFlag);
            setIconVisibility(userTemplate, "deleteIcon", deleteFlag);
            setIconVisibility(userTemplate, "configureIcon", configureFlag);
            setIconVisibility(userTemplate, "buildIcon", buildFlag);

            setIconVisibility(userTemplate, "viewCreateIcon", viewCreateFlag);
            setIconVisibility(userTemplate, "viewDeleteIcon", viewDeleteFlag);
            setIconVisibility(userTemplate, "viewConfigureIcon", viewConfigureFlag);

            setIconVisibility(userTemplate, "nodeCreateIcon", nodeCreateFlag);
            setIconVisibility(userTemplate, "nodeDeleteIcon", nodeDeleteFlag);
            setIconVisibility(userTemplate, "nodeConfigureIcon", nodeConfigureFlag);

            var updateIcon = jQuery(userTemplate).find("img[name='updateIcon']");
            jQuery(updateIcon).addClass("teamMemberUpdate");
            jQuery(updateIcon).unbind("click").click(function() {
                updateTeamMemberAction(this);
            });

            var removeIcon = jQuery(userTemplate).find("img[name='removeIcon']");
            jQuery(removeIcon).addClass("teamMemberRemove");
            jQuery(removeIcon).unbind("click").click(function() {
                removeTeamMemberAction(this);
            });

            var teamMemberList = jQuery('#teamMemberList_' + teamName);
            jQuery(userTemplate).appendTo(jQuery(teamMemberList));

            jQuery('#dialog-add-modify-user').dialog("close");
        },
        error: function(msg) {
            showMessage(msg.responseText, true, jQuery('#userAddMsg'));
        },
        dataType: "html"
    });
}

function setIconVisibility(template, iconName, flag) {
    var icon = jQuery(template).find("img[name=" + iconName + "]");
    icon.css('visibility', flag ? 'visible' : 'hidden');
}

function updateTeamMemberAction(updateItem) {
    var trParent = jQuery(updateItem).parents("tr:first");
    var memberName = jQuery(trParent).find("input[name='hiddenUserName']").val();
    var teamName = jQuery(trParent).find("input[name='hiddenTeamName']").val();

    setSelection(trParent, "adminIcon", "cb_adminFlag");
    setSelection(trParent, "createIcon", "cb_createFlag");
    setSelection(trParent, "deleteIcon", "cb_deleteFlag");
    setSelection(trParent, "configureIcon", "cb_configureFlag");
    setSelection(trParent, "buildIcon", "cb_buildFlag");

    setSelection(trParent, "viewCreateIcon", "cb_viewCreateFlag");
    setSelection(trParent, "viewDeleteIcon", "cb_viewDeleteFlag");
    setSelection(trParent, "viewConfigureIcon", "cb_viewConfigureFlag");

    setSelection(trParent, "nodeCreateIcon", "cb_nodeCreateFlag");
    setSelection(trParent, "nodeDeleteIcon", "cb_nodeDeleteFlag");
    setSelection(trParent, "nodeConfigureIcon", "cb_nodeConfigureFlag");

    jQuery("#text_sidName").hide();
    jQuery("#label_sidName").show();
    jQuery("#label_sidName").text(memberName);

    jQuery('#dialog-add-modify-user').dialog({
        resizable: false,
        autoResize: true,
//      height: 300,
        width: 450,
        modal: true,
        title: "Update Team Member",
        buttons: {
            'Update': function() {
                var adminFlag = jQuery("#cb_adminFlag").is(':checked');
                var createFlag = jQuery("#cb_createFlag").is(':checked');
                var deleteFlag = jQuery("#cb_deleteFlag").is(':checked');
                var configureFlag = jQuery("#cb_configureFlag").is(':checked');
                var buildFlag = jQuery("#cb_buildFlag").is(':checked');
                var viewCreateFlag = jQuery("#cb_viewCreateFlag").is(':checked');
                var viewDeleteFlag = jQuery("#cb_viewDeleteFlag").is(':checked');
                var viewConfigureFlag = jQuery("#cb_viewConfigureFlag").is(':checked');
                var nodeCreateFlag = jQuery("#cb_nodeCreateFlag").is(':checked');
                var nodeDeleteFlag = jQuery("#cb_nodeDeleteFlag").is(':checked');
                var nodeConfigureFlag = jQuery("#cb_nodeConfigureFlag").is(':checked');
                updateTeamMember(trParent, teamName, memberName, adminFlag,
                        createFlag, deleteFlag, configureFlag, buildFlag,
                        viewCreateFlag, viewDeleteFlag, viewConfigureFlag,
                        nodeCreateFlag, nodeDeleteFlag, nodeConfigureFlag);
            },
            Cancel: function() {
                jQuery(this).dialog("close");
            }
        }
    });
}

function setSelection(parent, iconName, checkboxId) {
    var icon = jQuery(parent).find("img[name=" + iconName + "]");
    var flag = jQuery(icon).css("visibility") === "visible";
    jQuery("#" + checkboxId).prop('checked', flag);
}

function updateTeamMember(trParent, teamName, member, adminFlag, createFlag, deleteFlag, configureFlag, buildFlag,
        viewCreateFlag, viewDeleteFlag, viewConfigureFlag, nodeCreateFlag, nodeDeleteFlag, nodeConfigureFlag) {
    jQuery.ajax({
        type: 'POST',
        url: "updateTeamMember",
        data: {
            teamName: teamName,
            teamMemberSid: member,
            isTeamAdmin: adminFlag,
            canCreate: createFlag,
            canDelete: deleteFlag,
            canConfigure: configureFlag,
            canBuild: buildFlag,
            canCreateNode: nodeCreateFlag,
            canDeleteNode: nodeDeleteFlag,
            canConfigureNode: nodeConfigureFlag,
            canCreateView: viewCreateFlag,
            canDeleteView: viewDeleteFlag,
            canConfigureView: viewConfigureFlag
        },
        success: function(iconNameResponse) {
            jQuery('#teamMemberNone_' + teamName).remove();

            var icon = jQuery(trParent).find("img[name='typeIcon']");
            jQuery(icon).attr("src", imageRoot + "/16x16/" + iconNameResponse);
            jQuery("span", trParent).text(member);

            setIconVisibility(trParent, "adminIcon", adminFlag);
            if (adminFlag) {
                createFlag = deleteFlag = configureFlag = buildFlag = viewCreateFlag =
                        viewDeleteFlag = viewConfigureFlag = nodeCreateFlag = nodeDeleteFlag = nodeConfigureFlag = true;
            }
            setIconVisibility(trParent, "createIcon", createFlag);
            setIconVisibility(trParent, "deleteIcon", deleteFlag);
            setIconVisibility(trParent, "configureIcon", configureFlag);
            setIconVisibility(trParent, "buildIcon", buildFlag);

            setIconVisibility(trParent, "viewCreateIcon", viewCreateFlag);
            setIconVisibility(trParent, "viewDeleteIcon", viewDeleteFlag);
            setIconVisibility(trParent, "viewConfigureIcon", viewConfigureFlag);

            setIconVisibility(trParent, "nodeCreateIcon", nodeCreateFlag);
            setIconVisibility(trParent, "nodeDeleteIcon", nodeDeleteFlag);
            setIconVisibility(trParent, "nodeConfigureIcon", nodeConfigureFlag);

            jQuery('#dialog-add-modify-user').dialog("close");
        },
        error: function(msg) {
            showMessage(msg.responseText, true, jQuery('#userAddMsg'));
        },
        dataType: "html"
    });
}

function removeTeamMemberAction(deleteItem) {
    clearMessage(jQuery('#userRemoveMsg'));
    var trParent = jQuery(deleteItem).parents("tr:first");
    var memberName = jQuery(trParent).find("input[name='hiddenUserName']").val();
    var teamName = jQuery(trParent).find("input[name='hiddenTeamName']").val();
    jQuery('#dialog-remove-user').dialog({
        resizable: false,
        autoResize: true,
//      height: 165,
        width: 400,
        modal: true,
        title: "Remove Team Member - " + memberName,
        buttons: {
            'Remove': function() {
                removeTeamMember(teamName, memberName, trParent);
            },
            Cancel: function() {
                jQuery(this).dialog("close");
            }
        }
    });
}

function removeTeamMember(teamName, memberName, parent) {
    jQuery.ajax({
        type: 'POST',
        url: "removeTeamMember",
        data: {
            teamName: teamName,
            teamMemberSid: memberName
        },
        success: function() {
            parent.remove();
            jQuery('#dialog-remove-user').dialog("close");
            if (jQuery('#teamMemberList_' + teamName).find('tr').length < 3) {
                jQuery('#teamMemberListHeader1_' + teamName).css('visibility', 'hidden');
                jQuery('#teamMemberListHeader2_' + teamName).css('visibility', 'hidden');
            }
        },
        error: function(msg) {
            showMessage(msg.responseText, true, jQuery('#userRemoveMsg'));
        },
        dataType: "html"
    });
}

function configureJobVisibilityAction(configureJobItem) {

    clearMessage(jQuery('#configureVisibilityMsg'));

    var trParent = jQuery(configureJobItem).parents("tr:first");
    var jobName = jQuery(trParent).find("input[name='hiddenJobId']").val();
    var teamName = jQuery(trParent).find("input[name='hiddenTeamName']").val();
    var teamNames = jQuery(trParent).find("input[name='hiddenVisibilities']").val();
    var allowViewConfig = jQuery(trParent).find("input[name='hiddenAllowViewConfig']").val();

    jQuery('#dialog-configure-visibility').dialog({
        resizable: false,
        autoResize: true,
//        height: 300,
        width: 350,
        modal: true,
        title: "Update Job Visibility - " + jobName,
        buttons: {
            'Update': function() {
                teamNames = "";
                jQuery('#configure-visibility-team-list input[@type=checkbox]:checked').each(function() {
                    teamNames += (jQuery(this).val() + ":");
                });
                if (jQuery('#publicVisibility').is(":checked")) {
                    teamNames += "public";
                }

                allowViewConfig = jQuery('#allowViewConfig').is(":checked");

                jQuery(trParent).find("input[name='hiddenVisibilities']").val(teamNames);
                jQuery(trParent).find("input[name='hiddenAllowViewConfig']").val(allowViewConfig);
                var teamNamesStr = teamNames;
                if (teamNames.trim().length === 0) {
                    teamNamesStr = "None";
                } else {
                    teamNamesStr = teamNamesStr.replace(/:/g, ",");
                    teamNamesStr = teamNamesStr.substring(0, teamNamesStr.length - 1);
                }
                jQuery(trParent).find("span[name='visibilitySpanName']").text(teamNamesStr);
                configureJobVisibility(jobName, teamNames, allowViewConfig);
            },
            Cancel: function() {
                jQuery(this).dialog("close");
            }
        }
    });

    if ("true" === allowViewConfig) {
        jQuery("#allowViewConfig").prop('checked', true);
    } else {
        jQuery("#allowViewConfig").prop('checked', false);
    }

    fillConfigureTeamList("configure-visibility-team-list", "publicVisibility", teamNames, teamName);
}

function fillConfigureTeamList(teamListId, publicTeamId, teamNames, teamName) {

    jQuery.getJSON('getAllTeamsJson', function(json) {
        jQuery("#" + teamListId).empty();
        var publicItem = jQuery("#" + publicTeamId);
        if (teamNames.indexOf("public") >= 0) {
            jQuery(publicItem).prop('checked', true);
        } else {
            jQuery(publicItem).prop('checked', false);
        }
        jQuery.each(json, function(key, val) {
            if ((key !== "public") && (key !== teamName)) {
                var item = jQuery("#team-visibility-item-template div").clone();
                jQuery(item).find("label").text(key);
                var input = jQuery(item).find("input");
                jQuery(input).val(key);
                if (key === teamName) {
                    jQuery(input).prop('checked', true);
                    jQuery(input).prop('disabled', true);
                } else {
                    jQuery(input).prop('checked', (teamNames.indexOf(key) >= 0));
                }
                jQuery(item).appendTo(jQuery("#" + teamListId));
            }
        });
    });
}

function configureJobVisibility(jobName, teamNames, allowViewConfig) {
    jQuery.ajax({
        type: 'POST',
        url: "setJobVisibility",
        data: {
            jobName: jobName,
            teamNames: teamNames,
            canViewConfig: allowViewConfig
        },
        success: function() {
            jQuery('#dialog-configure-visibility').dialog("close");
        },
        error: function(msg) {
            showMessage(msg.responseText, true, jQuery('#configureVisibilityMsg'));
        },
        dataType: "html"
    });
}

function configureViewVisibilityAction(configureViewItem) {

    clearMessage(jQuery('#configureViewVisibilityMsg'));

    var trParent = jQuery(configureViewItem).parents("tr:first");
    var viewName = jQuery(trParent).find("input[name='hiddenViewId']").val();
    var teamName = jQuery(trParent).find("input[name='hiddenTeamName']").val();
    var teamNames = jQuery(trParent).find("input[name='hiddenViewVisibilities']").val();

    jQuery('#dialog-configure-view-visibility').dialog({
        resizable: false,
        autoResize: true,
//        height: 300,
        width: 350,
        modal: true,
        title: "Update View Visibility - " + viewName,
        buttons: {
            'Update': function() {
                teamNames = "";
                jQuery('#configure-view-visibility-team-list input[@type=checkbox]:checked').each(function() {
                    teamNames += (jQuery(this).val() + ":");
                });
                if (jQuery('#viewPublicVisibility').is(":checked")) {
                    teamNames += "public";
                }

                jQuery(trParent).find("input[name='hiddenViewVisibilities']").val(teamNames);
                var teamNamesStr = teamNames;
                if (teamNames.trim().length === 0) {
                    teamNamesStr = "None";
                } else {
                    teamNamesStr = teamNamesStr.replace(/:/g, ",");
                    teamNamesStr = teamNamesStr.substring(0, teamNamesStr.length - 1);
                }
                jQuery(trParent).find("span[name='visibilitySpanName']").text(teamNamesStr);
                configureViewVisibility(viewName, teamNames);
            },
            Cancel: function() {
                jQuery(this).dialog("close");
            }
        }
    });

    fillConfigureTeamList("configure-view-visibility-team-list", "viewPublicVisibility", teamNames, teamName);

}

function configureViewVisibility(viewName, teamNames) {
    jQuery.ajax({
        type: 'POST',
        url: "setViewVisibility",
        data: {
            viewName: viewName,
            teamNames: teamNames
        },
        success: function() {
            jQuery('#dialog-configure-view-visibility').dialog("close");
        },
        error: function(msg) {
            showMessage(msg.responseText, true, jQuery('#configureViewVisibilityMsg'));
        },
        dataType: "html"
    });
}

function setPrimaryViewAction(configureViewItem) {

    clearMessage(jQuery('#setPrimaryViewMsg'));

    var trParent = jQuery(configureViewItem).parents("p:first");
    var viewName = jQuery(trParent).find("input[name='hiddenPrimaryViewId']").val();
    var teamName = jQuery(trParent).find("input[name='hiddenTeamName']").val();

    jQuery('#dialog-set-primary-view').dialog({
        resizable: false,
        autoResize: true,
//        height: 300,
        width: 350,
        modal: true,
        title: "Set Default View ",
        buttons: {
            'Set': function() {
                var viewName = jQuery("#viewChoice option:selected").val();
                setPrimaryView(viewName, teamName);
                jQuery("#teamPrimaryView_" + teamName).text(viewName);
                jQuery(this).dialog("close");
            },
            Cancel: function() {
                jQuery(this).dialog("close");
            }
        }
    });

    var data = {
        teamName: teamName
    };

    jQuery.getJSON('getViewsJson', data, function(json) {
        jQuery('#viewChoice').empty();
        jQuery.each(json, function(key, val) {
            var item = '<option value="' + key + '">' + val + '</option>';
            if (key === viewName) {
                item = '<option selected="true" value="' + key + '">' + val + '</option>';
            }
            jQuery(item).appendTo(jQuery('#viewChoice'));
        });
    });
}

function setPrimaryView(viewName, teamName) {
    jQuery.ajax({
        type: 'POST',
        url: "setPrimaryView",
        data: {
            viewName: viewName,
            teamName: teamName
        },
        success: function() {
            jQuery('#dialog-set-primary-view').dialog("close");
        },
        error: function(msg) {
            showMessage(msg.responseText, true, jQuery('#setPrimaryViewMsg'));
        },
        dataType: "html"
    });
}

function configureNodeVisibilityAction(configureNodeItem) {

    clearMessage(jQuery('#configureNodeVisibilityMsg'));

    var trParent = jQuery(configureNodeItem).parents("tr:first");
    var nodeName = jQuery(trParent).find("input[name='hiddenNodeId']").val();
    var teamName = jQuery(trParent).find("input[name='hiddenTeamName']").val();
    var teamNames = jQuery(trParent).find("input[name='hiddenNodeVisibilities']").val();

    jQuery('#dialog-configure-node-visibility').dialog({
        resizable: false,
        autoResize: true,
//        height: 300,
        width: 350,
        modal: true,
        title: "Update Node Visibility - " + nodeName,
        buttons: {
            'Update': function() {
                teamNames = "";
                jQuery('#configure-node-visibility-team-list input[@type=checkbox]:checked').each(function() {
                    teamNames += (jQuery(this).val() + ":");
                });
                if (jQuery('#nodePublicVisibility').is(":checked")) {
                    teamNames += "public";
                }

                jQuery(trParent).find("input[name='hiddenNodeVisibilities']").val(teamNames);

                var teamNamesStr = teamNames;
                if (teamNames.trim().length === 0) {
                    teamNamesStr = "None";
                } else {
                    teamNamesStr = teamNamesStr.replace(/:/g, ",");
                    teamNamesStr = teamNamesStr.substring(0, teamNamesStr.length - 1);
                }
                jQuery(trParent).find("span[name='visibilitySpanName']").text(teamNamesStr);
                configureNodeVisibility(nodeName, teamNames);
            },
            Cancel: function() {
                jQuery(this).dialog("close");
            }
        }
    });

    fillConfigureTeamList("configure-node-visibility-team-list", "nodePublicVisibility", teamNames, teamName);
}

function configureNodeVisibility(nodeName, teamNames) {
    jQuery.ajax({
        type: 'POST',
        url: "setNodeVisibility",
        data: {
            nodeName: nodeName,
            teamNames: teamNames
        },
        success: function() {
            jQuery('#dialog-configure-node-visibility').dialog("close");
        },
        error: function(msg) {
            showMessage(msg.responseText, true, jQuery('#configureNodeVisibilityMsg'));
        },
        dataType: "html"
    });
}

function configureVisibleNodeEnableAction(configureNodeItem) {

    clearMessage(jQuery('#configureEnableVisibleNodeMsg'));

    var trParent = jQuery(configureNodeItem).parents("tr:first");
    var nodeName = jQuery(trParent).find("input[name='hiddenNodeId']").val();
    var teamName = jQuery(trParent).find("input[name='hiddenTeamName']").val();

    setSelection(trParent, "nodeEnabledIcon", "enableVisibleNode");

    jQuery('#dialog-configure-visible-node-enable').dialog({
        resizable: false,
        autoResize: true,
//        height: 300,
        width: 350,
        modal: true,
        title: "Enable Node - " + nodeName,
        buttons: {
            'Update': function() {
                var enabled = false;
                if (jQuery('#enableVisibleNode').is(":checked")) {
                    enabled = true;
                }
                configureVisibleNodeEnable(nodeName, teamName, enabled);
                setIconVisibility(trParent, "nodeEnabledIcon", enabled);
            },
            Cancel: function() {
                jQuery(this).dialog("close");
            }
        }
    });
}

function configureVisibleNodeEnable(nodeName, teamName, enabled) {
    jQuery.ajax({
        type: 'POST',
        url: "setNodeEnabled",
        data: {
            nodeName: nodeName,
            teamName: teamName,
            enabled: enabled
        },
        success: function() {
            jQuery('#dialog-configure-visible-node-enable').dialog("close");
        },
        error: function(msg) {
            showMessage(msg.responseText, true, jQuery('#configureEnableVisibleNodeMsg'));
        },
        dataType: "html"
    });
}

var moveCount;
var jobsToMove;
function moveJobsButtonAction() {
    jQuery("#selectedJobs").empty();
    jQuery('#moveJobMsg').hide();
    jobsToMove = getJobsToMove();
    moveCount = jobsToMove.length;
    for (var i = 0; i < jobsToMove.length; i++) {
        var item = '<li value="' + jobsToMove[i] + '">' + jobsToMove[i] + ' <img style="display: none"/></li>';
        jQuery(item).appendTo(jQuery("#selectedJobs"));
    }

    jQuery('#dialog-move-jobs').dialog({
        resizable: false,
        //height: 200 + moveCount * 25,
        autoResize: true,
        width: 400,
        modal: true,
        title: "Move Jobs to another Team",
        buttons: {
            'Move': function() {
                if (moveCount > 0) {
                    var teamName = jQuery("#teamChoice option:selected").val();
                    for (var i = 0; i < jobsToMove.length; i++) {
                        var img = jQuery("#selectedJobs li[value='" + jobsToMove[i] + "']").children('img');
                        jQuery(img).attr('src', imageRoot + '/spinner.gif');
                        jQuery(img).show();
                        moveJob(jobsToMove[i], teamName, img);
                    }
                }
            },
            Cancel: function() {
                jQuery(this).dialog("close");
            }
        }
    });

    jQuery.getJSON('getTeamsJson', function(json) {
        jQuery('#teamChoice').empty();
        jQuery.each(json, function(key, val) {
            var item = '<option value="' + key + '">' + val + '</option>';
            jQuery(item).appendTo(jQuery('#teamChoice'));
        });
    });

}

function getJobsToMove() {
    var jobs = [];
    jQuery('#teamJobsContainer input[@type=checkbox]:checked').each(function() {
        jobs.push(jQuery(this).val());
    });
    return jobs;
}

function moveJob(jobName, teamName, img) {
    jQuery('#teamJobsContainer input[@type=checkbox]:checked').each(function() {
        jQuery(this).prop('checked', false);
    });
    jQuery.ajax({
        type: 'POST',
        url: "moveJob",
        data: {
            jobName: jobName,
            teamName: teamName
        },
        success: function(newJobNameResponse) {
            jQuery(img).attr('src', imageRoot + '/green-check.jpg');

            var column3 = "job_colum3_span_" + jobName.replace(".", "\\.");
            var nameColumn = jQuery('#teamJobsContainer').find("span[name=" + column3 + "]");
            jQuery(nameColumn).text(newJobNameResponse);
            var newColumn3 = "job_colum3_span_" + newJobNameResponse;
            jQuery(nameColumn).attr('name', newColumn3);
            var column3Link = "job_colum3_link_" + jobName.replace(".", "\\.");
            var nameColumnLink = jQuery('#teamJobsContainer').find("a[name=" + column3Link + "]");
            jQuery(nameColumnLink).attr('href', rootUrl + '/job/' + newJobNameResponse);

            var column4 = "job_colum4_span_" + jobName.replace(".", "\\.");
            var teamColumn = jQuery('#teamJobsContainer').find("span[name=" + column4 + "]");
            jQuery(teamColumn).text(teamName);
            var newColumn4 = "job_colum4_span_" + newJobNameResponse;
            jQuery(teamColumn).attr('name', newColumn4);

            moveCount--;
            if (moveCount === 0) {
                jQuery('#dialog-move-jobs').dialog("close");
                refreshTeamInfo(selectedTeamName);
            }
        },
        error: function(msg) {
            var originalHeight = jQuery('#dialog-move-jobs').height();
            jQuery('#dialog-move-jobs').css({
                height: originalHeight + 50
            });
            jQuery(img).attr('src', imageRoot + '/16x16/error.png');
            showMessage(msg.responseText, true, jQuery('#moveJobMsg'));
        },
        dataType: "html"
    });
}

var viewMoveCount;
var viewsToMove;
function moveViewsButtonAction() {
    jQuery("#selectedViews").empty();
    jQuery('#moveViewMsg').hide();
    viewsToMove = getViewsToMove();
    viewMoveCount = viewsToMove.length;
    for (var i = 0; i < viewsToMove.length; i++) {
        var item = '<li value="' + viewsToMove[i] + '">' + viewsToMove[i] + ' <img style="display: none"/></li>';
        jQuery(item).appendTo(jQuery("#selectedViews"));
    }

    jQuery('#dialog-move-views').dialog({
        resizable: false,
        //height: 200 + viewMoveCount * 25,
        autoResize: true,
        width: 400,
        modal: true,
        title: "Move Views to another Team",
        buttons: {
            'Move': function() {
                if (viewMoveCount > 0) {
                    var teamName = jQuery("#teamChoiceForViews option:selected").val();
                    for (var i = 0; i < viewsToMove.length; i++) {
                        var img = jQuery("#selectedViewss li[value='" + viewsToMove[i] + "']").children('img');
                        jQuery(img).attr('src', imageRoot + '/spinner.gif');
                        jQuery(img).show();
                        moveView(viewsToMove[i], teamName, img);
                    }
                }
            },
            Cancel: function() {
                jQuery(this).dialog("close");
            }
        }
    });

    jQuery.getJSON('getTeamsJson', function(json) {
        jQuery('#teamChoiceForViews').empty();
        jQuery.each(json, function(key, val) {
            var item = '<option value="' + key + '">' + val + '</option>';
            jQuery(item).appendTo(jQuery('#teamChoiceForViews'));
        });
    });

}

function getViewsToMove() {
    var viewss = [];
    jQuery('#teamViewsContainer input[@type=checkbox]:checked').each(function() {
        viewss.push(jQuery(this).val());
    });
    return viewss;
}

function moveView(viewName, teamName, img) {
    jQuery('#teamViewsContainer input[@type=checkbox]:checked').each(function() {
        jQuery(this).prop('checked', false);
    });
    jQuery.ajax({
        type: 'POST',
        url: "moveView",
        data: {
            viewName: viewName,
            teamName: teamName
        },
        success: function() {
            jQuery(img).attr('src', imageRoot + '/green-check.jpg');
            jQuery("#view_colum3_span_" + viewName.replace(".", "\\.")).text(teamName);
            viewMoveCount--;
            if (viewMoveCount === 0) {
                jQuery('#dialog-move-views').dialog("close");
                refreshTeamInfo(selectedTeamName);
            }
        },
        error: function(msg) {
            var originalHeight = jQuery('#dialog-move-views').height();
            jQuery('#dialog-move-views').css({
                height: originalHeight + 50
            });
            jQuery(img).attr('src', imageRoot + '/16x16/error.png');
            showMessage(msg.responseText, true, jQuery('#moveViewMsg'));
        },
        dataType: "html"
    });
}

var nodeMoveCount;
var nodesToMove;
function moveNodesButtonAction() {
    jQuery("#selectedNodes").empty();
    jQuery('#moveNodeMsg').hide();
    nodesToMove = getNodesToMove();
    nodeMoveCount = nodesToMove.length;
    for (var i = 0; i < nodesToMove.length; i++) {
        var item = '<li value="' + nodesToMove[i] + '">' + nodesToMove[i] + ' <img style="display: none"/></li>';
        jQuery(item).appendTo(jQuery("#selectedNodes"));
    }

    jQuery('#dialog-move-nodes').dialog({
        resizable: false,
        //height: 200 + nodeMoveCount * 25,
        autoResize: true,
        width: 400,
        modal: true,
        title: "Move Nodes to another Team",
        buttons: {
            'Move': function() {
                if (nodeMoveCount > 0) {
                    var teamName = jQuery("#teamChoiceForNodes option:selected").val();
                    for (var i = 0; i < nodesToMove.length; i++) {
                        var img = jQuery("#selectedNodes li[value='" + nodesToMove[i] + "']").children('img');
                        jQuery(img).attr('src', imageRoot + '/spinner.gif');
                        jQuery(img).show();
                        moveNode(nodesToMove[i], teamName, img);
                    }
                }
            },
            Cancel: function() {
                jQuery(this).dialog("close");
            }
        }
    });

    jQuery.getJSON('getTeamsJson', function(json) {
        jQuery('#teamChoiceForNodes').empty();
        jQuery.each(json, function(key, val) {
            var item = '<option value="' + key + '">' + val + '</option>';
            jQuery(item).appendTo(jQuery('#teamChoiceForNodes'));
        });
    });

}

function getNodesToMove() {
    var nodes = [];
    jQuery('#teamNodesContainer input[@type=checkbox]:checked').each(function() {
        nodes.push(jQuery(this).val());
    });
    return nodes;
}

function moveNode(nodeName, teamName, img) {
    jQuery('#teamNodesContainer input[@type=checkbox]:checked').each(function() {
        jQuery(this).prop('checked', false);
    });
    jQuery.ajax({
        type: 'POST',
        url: "moveNode",
        data: {
            nodeName: nodeName,
            teamName: teamName
        },
        success: function() {
            jQuery(img).attr('src', imageRoot + '/green-check.jpg');
            jQuery("#node_colum3_span_" + nodeName.replace(".", "\\.")).text(teamName);
            nodeMoveCount--;
            if (nodeMoveCount === 0) {
                jQuery('#dialog-move-nodes').dialog("close");
                refreshTeamInfo(selectedTeamName);
            }
        },
        error: function(msg) {
            var originalHeight = jQuery('#dialog-move-nodes').height();
            jQuery('#dialog-move-nodes').css({
                height: originalHeight + 50
            });
            jQuery(img).attr('src', imageRoot + '/16x16/error.png');
            showMessage(msg.responseText, true, jQuery('#moveNodeMsg'));
        },
        dataType: "html"
    });
}

function verifySid(sidElement) {
    var sid = jQuery(sidElement).find("input[name='hiddenUserName']").val();
    if (sid) {
        jQuery.ajax({
            type: 'POST',
            url: "checkSid",
            data: {
                sid: sid
            },
            success: function(iconNameResponse) {
                var icon = jQuery(sidElement).find("img[name='typeIcon']");
                jQuery(icon).attr("src", imageRoot + "/16x16/" + iconNameResponse);
                jQuery(icon).css('visibility', 'visible');
            },
            dataType: "html"
        });
    }
}

function showMessage(msg, error, infoTxt) {
    infoTxt.text(msg);
    if (error) {
        infoTxt.css("color", "red");
    } else {
        infoTxt.css("color", "green");
    }
    infoTxt.show();
}

function clearMessage(infoTxt) {
    infoTxt.text("");
    infoTxt.css("color", "black");
    infoTxt.hide();
}