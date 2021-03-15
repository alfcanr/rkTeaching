// author: Alfredo Sánchez Alberca (asalber@ceu.es)
var variable,
    rules,
    save;

function setGlobalVars() {
    variable = getString("variable");
    rules = getString("rules");
    save = getString("save");
}

function preprocess() {
    setGlobalVars();
    echo("library(car)\n");
}

function calculate() {
    var asfactor = getBoolean("asfactor.state");
    rules = rules.replace(/\n/gi, '; ').replace(/'/g, '"');
    comment("Applying the recoding rules");
    echo(".GlobalEnv$" + save + " <- Recode(" + variable + ", '" + rules + "'");
    //if (asfactor) {
      //  echo(", as.factor=TRUE");
    //} else {
      //  echo(", as.factor=FALSE");
    //}
    echo(")\n");
}

function printout(is_preview) {
    new Header(i18n("Variable recoding")).addFromUI("variable").add(i18n("Recoding rules"), rules).addFromUI("save").print();
}
