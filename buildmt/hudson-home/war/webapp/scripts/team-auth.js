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

var pageInitialized = false;
jQuery(document).ready(function() {
    
    //To avoid multiple fire of document.ready
    if (pageInitialized){
        return;
    }
    pageInitialized = true;

    jQuery('#sysAdminAddButton').button();
    jQuery('#sysAdminAddButton').click(function() {
        sysAdminAddButtonAction();
    });
    
    jQuery('#sysAdminList img.sysAdminRemove').each(function() {
        jQuery(this).unbind("click").click(function() {
            removeSysAdminAction(this);
        });
    });

    jQuery('#sysAdminList li').each(function() {
         verifySid(this);
    });
});

function verifySid(sidElement) {
    var sysAdminSid = jQuery(sidElement).text();
    jQuery(this).remove();
    jQuery.ajax({
        type: 'POST',
        url: rootURL + "/descriptor/" + descriptorClazz + "/checkSid",
        data: {
            sid: sysAdminSid
        },
        success: function(iconNameResponse) {
            var icon = jQuery(sidElement).children("img[name='typeIcon']");
            jQuery(icon).attr("src", imageRoot + "/16x16/" + iconNameResponse);
            jQuery(icon).css('visibility', 'visible');
        },
        error: function(msg) {
            showMessage(msg.responseText, true, jQuery('#sysAdminMsg'));
        },
        dataType: "html"
    });
}

function sysAdminAddButtonAction(teamName) {
    clearMessage(jQuery('#userAddMsg'));
    
    jQuery('#dialog-add-user').dialog({
        resizable: false,
        height: 165,
        width: 400,
        modal: true,
        title: "Add System Admin",
        buttons: {
            'Add': function() {
                var sid = jQuery("#sidName").val();
                addSysAdmin(sid);
            },
            Cancel: function() {
                jQuery(this).dialog("close");
            }
        }
    });
}

function addSysAdmin(adminSid) {
    jQuery.ajax({
        type: 'POST',
        url: rootURL +  "/descriptor/" + descriptorClazz + "/addSysAdmin",
        data: {
            sysAdminSid: adminSid
        },
        success: function(iconNameResponse) {
            jQuery('#sysAdminNone').remove();
            var userTemplate = jQuery("#sysAdminTemplate li").clone();
            jQuery("input", userTemplate).attr("value", adminSid);
            var icon = jQuery(userTemplate).children("img[name='typeIcon']");
            jQuery(icon).attr("src", imageRoot + "/16x16/" + iconNameResponse);
            jQuery("span", userTemplate).text(adminSid);
            var sysAdminRemove = jQuery('.sysAdminRemove', userTemplate);
            jQuery(sysAdminRemove).unbind("click").click(function() {
                removeSysAdminAction(this);
            });
            jQuery(userTemplate).appendTo(jQuery('#sysAdminList'));
            jQuery('#dialog-add-user').dialog("close");
        },
        error: function(msg) {
            showMessage(msg.responseText, true, jQuery('#userAddMsg'));
        },
        dataType: "html"
    });
}

function removeSysAdminAction(deleteItem) {
    clearMessage(jQuery('#userRemoveMsg'));
    var adminName = jQuery(deleteItem).siblings("input[name='hiddenUserName']").val();
    var parent = jQuery(deleteItem).parent();
    jQuery('#dialog-remove-user').dialog({
        resizable: false,
        height: 165,
        width: 400,
        modal: true,
        title: "Remove Sys Admin - " + adminName,
        buttons: {
            'Remove': function() {
                removeSysAdmin(adminName, parent);
            },
            Cancel: function() {
                jQuery(this).dialog("close");
            }
        }
    });
}

function removeSysAdmin(adminName, parent) {
    jQuery.ajax({
        type: 'POST',
        url: rootURL +  "/descriptor/" + descriptorClazz + "/removeSysAdmin",
        data: {
            sysAdminSid: adminName
        },
        success: function() {
            parent.remove();
            jQuery('#dialog-remove-user').dialog("close");
        },
        error: function(msg) {
            showMessage(msg.responseText, true, jQuery('#userRemoveMsg'));
        },
        dataType: "html"
    });
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