/*  
 * ******************************************************************************
 *  Copyright (c) 2012 Oracle Corporation.
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

var loggedIn = false;

var installCount = 0;
var obsoleteCount = 0;

var finish = false;
var forProxy = false;
var forInstall = false;
var forContinue = false;

function installPlugin(selected) {
    jQuery('#errorMessage').hide();
    jQuery(selected).hide();
    var icon = jQuery("#" + jQuery(selected).val());
    jQuery(icon).show();
    icon.attr('src', imageRoot + '/progressbar.gif');
    jQuery.ajax({
        type: 'POST',
        url: "installPlugin",
        data: {
            pluginName: jQuery(selected).val()
        },
        success: function() {
            icon.attr('src', imageRoot + '/green-check.jpg');
            jQuery(selected).attr("checked", false);
            installCount--;
            if (installCount === 0) {
                if (finish === true) {
                    doFinish();
                }
                jQuery("#buttonBar").show();
                jQuery("#installProgress").hide();
            }

        },
        error: function(msg) {
            icon.attr('src', imageRoot + '/error.png');
            showMessage(jQuery('#infoMsg'), msg.responseText, "red");
            installCount--;
            if (installCount === 0) {
                jQuery("#buttonBar").show();
                jQuery("#installProgress").hide();
            }
        },
        statusCode: {
            403: function() {
                showLoginDialog();
            }
        },
        dataType: "html"
    });
}


function checkPermissionAndinstallPlugins() {
    if (needsAdminLogin === true) {
        if (loggedIn === false) {
            forInstall = true;
            showLoginDialog();
        } else {
            disableObsoletePlugins();
            installSelectedPlugins();
        }
    } else {
        disableObsoletePlugins();
        installSelectedPlugins();
    }
}

function installSelectedPlugins() {
    var installables = getInstallables();
    installCount = installables.length;
    if (installCount > 0) {
        jQuery("#buttonBar").hide();
        jQuery("#installProgress").show();
        jQuery(installables).each(function() {
            installPlugin(this);
        });
    }else{
        if (finish === true) {
            doFinish();
        } else {
            jQuery("#buttonBar").show();
            jQuery("#installProgress").hide();
        }
    }
}

function getInstallables() {
    var installables = [];
    jQuery('#compatibilityPlugins input[@type=checkbox]:checked').each(function() {
        installables.push(this);
    });
    jQuery('#featuredPlugins input[@type=checkbox]:checked').each(function() {
        installables.push(this);
    });
    jQuery('#recommendedPlugins input[@type=checkbox]:checked').each(function() {
        installables.push(this);
    });
    jQuery('#updatablePlugins input[@type=checkbox]:checked').each(function() {
        installables.push(this);
    });
    return installables;
}

function disablePlugin(selected) {
    jQuery('#errorMessage').hide();
    jQuery(selected).hide();
    var icon = jQuery("#" + jQuery(selected).val());
    jQuery(icon).show();
    icon.attr('src', imageRoot + '/progressbar.gif');
    jQuery.ajax({
        type: 'POST',
        url: "disablePlugin",
        data: {
            pluginName: jQuery(selected).val()
        },
        success: function() {
            icon.attr('src', imageRoot + '/warning.png');
            jQuery(selected).attr("checked", false);
        },
        error: function(msg) {
            icon.attr('src', imageRoot + '/error.png');
            showMessage(jQuery('#infoMsg'), msg.responseText, "red");
        },
        statusCode: {
            403: function() {
                showLoginDialog();
            }
        },
        dataType: "html"
    });
}

function getObsoletePlugins () {
    var obsoletePlugins = [];
    jQuery('#obsoletePlugins input[@type=checkbox]:checked').each(function() {
        obsoletePlugins.push(this);
    });
    return obsoletePlugins;
}

function disableObsoletePlugins() {
    var obsoletePlugins = getObsoletePlugins();
    var obsoleteCount = obsoletePlugins.length;
    if (obsoleteCount > 0) {
        jQuery("#buttonBar").hide();
        jQuery("#installProgress").show();
        jQuery(obsoletePlugins).each(function() {
            disablePlugin(this);
        });
    }
}


function showLoginDialog() {
    jQuery('#loginMsg').hide();
    jQuery('#loginDialog').dialog({
        resizable: false,
        height: 250,
        width: 350,
        modal: true,
        buttons: {
            'Login': function() {
                submitLoginForm();
            },
            Cancel: function() {
                jQuery('#loginMsg').hide();
                jQuery('#j_username').attr({
                    value: ""
                });
                jQuery('#j_password').attr({
                    value: ""
                });
                jQuery(this).dialog("close");
            }
        }
    });
    jQuery('j_username').focus();
}

function submitPoxyForm() {
    forProxy = false;
    showMessage(jQuery("#proxyMsg"), "Configuring proxy ..", "black");
    ;
    var dataString = jQuery("#proxyForm").serialize();
    jQuery.ajax({
        type: 'POST',
        url: "proxyConfigure",
        data: dataString,
        success: function() {
            var msg = 'Hudson server could successfully connect to the internet';
            showMessage(jQuery("#proxyMsg"), msg, "green");
        },
        error: function() {
            var msg = 'Hudson server still could not connect to the internet. Check the HTTP proxy settings and try again.';
            showMessage(jQuery("#proxyMsg"), msg, "red");
        },
        statusCode: {
            403: function() {
                forProxy = true;
                showLoginDialog();
            }
        },
        dataType: "html"
    });
}

function submitLoginForm() {
    showMessage(jQuery('#loginMsg'), "Logging in ..", "blue");
    var dataString = jQuery("#loginForm").serialize();
    jQuery.ajax({
        type: 'POST',
        url: loginUrl,
        data: dataString,
        success: function() {
            jQuery('#loginDialog').dialog("close");
            loggedIn = true;
            if (forProxy === true) {
                submitPoxyForm();
            }
            if (forInstall === true) {
                checkPermissionAndinstallPlugins();
            }
            if (forContinue === true) {
                doContinue("continue");
            }
            jQuery('#loginNeededMsg').hide();
        },
        error: function() {
            var msg = 'Failed to login. Check your credentials and try again.';
            showMessage(jQuery('#loginMsg'), msg, "red");
        },
        dataType: "html"
    });
}

function doFinish() {

    jQuery.ajax({
        type: 'GET',
        url: "finish",
        success: function() {
            window.location.href = ".";
        },
        error: function(msg) {
            icon.attr('src', imageRoot + '/error.png');
            showMessage(jQuery('#infoMsg'), msg.responseText, "red");
        },
        dataType: "html"
    });
}

function refreshProxyUser() {
    if (jQuery('#proxyAuth').is(':checked')) {
        jQuery('#proxyUser').show();
        jQuery('#proxyPassword').show();
    } else {
        jQuery('#proxyUser').hide();
        jQuery('#proxyPassword').hide();
    }
}

function doContinue(url) {
    jQuery.ajax({
        type: 'GET',
        url: url,
        success: function() {
            window.location.href = ".";
        },
        dataType: "html"
    });
}

function showMessage(widget, msg, color) {
    widget.text(msg);
    widget.css("color", color);
    widget.show();
}

var pageInitialized = false;
jQuery(document).ready(function() {

    //To avoid multiple fire of document.ready
    if (pageInitialized){
        return;
    }
    pageInitialized = true;

    var images = [
        imageRoot + '/green-check.jpg',
        imageRoot + '/progressbar.gif',
        imageRoot + '/error.png'
    ];

    jQuery(images).each(function() {
        jQuery('<img />').attr('src', this);
    });

    jQuery('#j_username').keypress(function(e) {
        if (e.which === 13) {
            submitLoginForm();
        }
    });

    jQuery('#j_password').keypress(function(e) {
        if (e.which === 13) {
            submitLoginForm();
        }
    });

    jQuery('#loginButton').button();
    jQuery('#loginButton').click(function() {

    });

    jQuery('#cancelButton').button();
    jQuery('#cancelButton').click(function() {
        jQuery('#j_username').attr({
            value: ""
        });
        jQuery('#j_password').attr({
            value: ""
        });
        jQuery('#loginError').hide();
        jQuery('#loginMsg').hide();
        return false;
    });

    jQuery('#installButton').button();
    jQuery('#installButton').unbind("click").click(function() {
        checkPermissionAndinstallPlugins();
    });


    jQuery('#finishButton').button();
    jQuery('#finishButton').unbind("click").click(function() {
        finish = true;
        checkPermissionAndinstallPlugins();
    });

    jQuery('#proxyUser').hide();
    jQuery('#proxyPassword').hide();


    jQuery('#proxyAuth').click(function() {
        refreshProxyUser();
    });

    if (proxyNeeded === true) {
        var proxySubmitButton = jQuery('#proxySubmitButton');
        proxySubmitButton.button();
        proxySubmitButton.click(function() {
            submitPoxyForm();
        });
    } else {
        jQuery('#proxySetup').hide();
    }

    if (needsAdminLogin === true) {
        jQuery('#loginNeededMsg').show();
    }

    jQuery('#continueButton').button();
    jQuery('#continueButton').click(function() {
        if (securitySet === true) {
            if (loggedIn === false) {
                forContinue = true;
                showLoginDialog();
            } else {
                doContinue("continue");
            }
        } else {
            doContinue("continue");
        }
    });

    jQuery('#fpFinishButton').button();
    jQuery('#fpFinishButton').click(function() {
        doContinue("finish");
    });

    jQuery('#fpFinishButton').show();
    jQuery('#fpInstallMsg').show();

    refreshProxyUser();
});