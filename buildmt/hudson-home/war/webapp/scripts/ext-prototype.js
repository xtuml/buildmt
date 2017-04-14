/*******************************************************************************
 *
 * Copyright (c) 2011 Oracle Corporation.
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *
 *    Nikita Levyankov
 *
 *******************************************************************************/
//Move patched logic from prototype library.
Form.Methods = {
  getInputs: function(form, typeName, name) {
    form = $(form);
    var inputs = form.getElementsByTagName('input');
    var textareas = form.getElementsByTagName('textarea');
    // KK patch
    var selects = form.getElementsByTagName('select');

    if (!typeName && !name) return $A(inputs).concat($A(textareas)).concat($A(selects)).map(Element.extend);


    var matchingInputs = [];
    var f = function(inputs) {
      for (var i = 0, length = inputs.length; i < length; i++) {
        var input = inputs[i];
        if ((typeName && input.type != typeName) || (name && input.name != name))
          continue;
        matchingInputs.push(Element.extend(input));
      }
    };
    f(inputs);
    f(textareas);
    f(selects);

    return matchingInputs;
  }
}