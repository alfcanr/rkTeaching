// author: Alfredo Sánchez Alberca (asalber@ceu.es)

include("../common/common_functions.js")
include("../common/filter.js")

// globals
var dataframe,
  design,
  variable,
  variableName,
  within,
  withinName,
  between,
  betweenName,
  caseId,
  caseIdName,
  observed,
  observedName,
  showSumSq,
  sumSqType,
  heterocedasticity,
  pairwiseMeans,
  pairwisePlot;

function setGlobalVars() {
  variable = getString("variable");
  variableName = getString("variable.shortname");
  dataframe = getDataframe(variable);
  design = getString("design");
  within = getList("within");
  withinName = getList("within.shortname");
  between = getList("between");
  betweenName = getList("between.shortname");
  caseId = getString("caseId");
  caseIdName = getString("caseId.shortname");
  observed = getList("observed");
  observedName = getList("observed.shortname");
  showSumSq = getBoolean("showSumSq");
  sumSqType = getString("sumSqType");
  heterocedasticity = getString("heterocedasticity");
  pairwiseMeans = getBoolean("pairwiseMeans");
  pairwisePlot = getBoolean("pairwisePlot");
}

function preprocess() {
  setGlobalVars();
  echo('require(ez)\n');
  echo('require(nlme)\n');
  echo('require(multcomp)\n');
}

function calculate() {
  // Filter
  filter();
  // ANOVA settings
  if (sumSqType == 3) {
    echo('# Set type III of sum of squares\n');
    echo('options(contrasts=c("contr.sum","contr.poly"))\n');
  }
  if (caseId == '' & design == 'between') {
    echo('# ezANOVA requires a case identifier variable\n');
    echo(dataframe + ' <- cbind(' + dataframe + ', subjectid=factor(1:nrow(' + dataframe + ')))\n');
  }
  echo('anova.results <- ezANOVA(data=' + dataframe + '[!is.na(' + dataframe + '$' + variableName + '),], dv=.(' + variableName + ')');
  if (caseId) {
    echo(', wid=' + caseIdName);
  } else if (design == 'between') {
    echo(', wid=subjectid');
  }
  if (within != '' & design != 'between') {
    echo(', within=.(' + withinName.join(", ") + ')');
  }
  if (between != '' & design != 'within') {
    echo(', between=.(' + betweenName.join(", ") + ')');
  }
  if (observed != '') {
    echo(', observed=.(' + observedName.join(", ") + ')');
  }
  if (sumSqType != 2) {
    echo(', type=' + sumSqType);
  }
  if (heterocedasticity != "false") {
    echo(', white.adjust=' + quote(heterocedasticity));
  }
  if (showSumSq) {
    echo(', detailed=TRUE');
  }
  echo(', return_aov=TRUE)\n');
  // Pairwise means coparison
  if (pairwiseMeans | pairwisePlot) {
    if (design == 'between') {
      echo('pairs <- TukeyHSD(anova.results[["aov"]])\n');
    }
    if (design == 'within') {
      echo('pairs <- glht(lme(' + variableName + '~' + withinName.join("*") + ', data = ' + dataframe + '[!is.na(' + dataframe + '$' + variableName + '),], random = ~1|' + caseIdName + '), linfct = mcp(' + withinName.join("=\"Tukey\",") + '= "Tukey"))\n');
    }
    if (design == 'mixed') {
      echo('pairs <- glht(lme(' + variableName + '~' + betweenName.join("*") + '*' + withinName.join("*") + ', data = ' + dataframe + '[!is.na(' + dataframe + '$' + variableName + '),], random = ~1|' + caseIdName + '), linfct = mcp(' + betweenName.join("=\"Tukey\",") + '= "Tukey", ' + withinName.join("=\"Tukey\",") + '= "Tukey"))\n');
    }
  }
}

function printout() {
  // Header
  header = new Header(i18n("ANOVA of %1", variableName));
  header.add(i18n("Data frame"), dataframe);
  header.add(i18n("Dependent variable"), variableName);
  if (between != '' & design != "within") {
    header.add(i18n("Between subjects factors"), betweenName.join(", "));
  }
  if (within != '' & design != "between") {
    header.add(i18n("Within subjects factors"), withinName.join(", "));
  }
  if (observed != '') {
    header.add(i18n("Observed (non-manipulated) factors"), observedName.join(", "));
  }
  header.add(i18n("Sums of squares"), 'Type' + sumSqType);
  if (filtered) {
    header.addFromUI("condition");
  }
  header.print();
  // ANOVA results
  echo('rk.results(list(');
  echo(i18n("Source of variation") + ' = anova.results[["ANOVA"]][["Effect"]], ');
  echo(i18n("Degrees of freedom <br/> numerator") + ' = anova.results[["ANOVA"]][["DFn"]], ');
  echo(i18n("Degrees of freedom <br/> denominator") + ' = anova.results[["ANOVA"]][["DFd"]], ');
  if (showSumSq) {
    echo(i18n("Sum of squares <br/> numerator") + ' = anova.results[["ANOVA"]][["SSn"]], ');
    echo(i18n("Sum of squares <br/> denominator") + ' = anova.results[["ANOVA"]][["SSd"]], ');
  }
  echo(i18n("F statistic") + ' = anova.results[["ANOVA"]][["F"]], ');
  echo(i18n("p-value") + ' = anova.results[["ANOVA"]][["p"]]');
  echo('))\n');
  // Mauchly's sphericity test (for repeated measures)
  echo("if(\"Mauchly\'s Test for Sphericity\" %in% names(anova.results)){\n");
  echo('\trk.header(' + i18n("Mauchly\'s test for sphericity") + ', level=3)\n');
  echo('\trk.results(list(');
  echo(i18n("Source of variation") + ' = anova.results[["Mauchly\'s Test for Sphericity"]][["Effect"]], ');
  echo(i18n("W statistic") + ' = anova.results[["Mauchly\'s Test for Sphericity"]][["W"]], ');
  echo(i18n("p-value") + ' = anova.results[["Mauchly\'s Test for Sphericity"]][["p"]]');
  echo('))\n}\n');
  // Sphericity correction
  echo('if("Sphericity Corrections" %in% names(anova.results)){\n');
  echo('\trk.header(' + i18n("Sphericity correction") + ', level=3)\n');
  echo('\trk.results(list(');
  echo(i18n("Source of variation") + ' = anova.results[["Sphericity Corrections"]][["Effect"]], ');
  echo(i18n("Epsilon Greenhouse-Geisser") + ' = anova.results[["Sphericity Corrections"]][["GGe"]], ');
  echo(i18n("G-G corrected p-value") + ' = anova.results[["Sphericity Corrections"]][["p[GG]"]], ');
  echo(i18n("Epsilon Huynh-Feldt") + ' = anova.results[["Sphericity Corrections"]][["HFe"]], ');
  echo(i18n("H-F corrected p-value") + ' = anova.results[["Sphericity Corrections"]][["p[HF]"]]');
  echo('))\n}\n');
  // Levene's test for homogeneity of variance
  echo('if("Levene\'s Test for Homogeneity of Variance" %in% names(anova.results)){\n');
  echo('\trk.header("Levene\'s test for comparing variances", level=3)\n');
  echo('\trk.results(list(');
  echo(i18n("Degrees of freedom <br/> numerator") + ' = anova.results[["Levene\'s Test for Homogeneity of Variance"]][["DFn"]], ');
  echo(i18n("Degrees of freedom <br/> denominator") + ' = anova.results[["Levene\'s Test for Homogeneity of Variance"]][["DFd"]], ');
  echo(i18n("Sum of squares <br/> numerator") + ' = anova.results[["Levene\'s Test for Homogeneity of Variance"]][["SSn"]], ');
  echo(i18n("Sum of squares <br/> denominator") + ' = anova.results[["Levene\'s Test for Homogeneity of Variance"]][["SSd"]], ');
  echo(i18n("F statistics") + ' = anova.results[["Levene\'s Test for Homogeneity of Variance"]][["F"]], ');
  echo(i18n("p-value") + ' = anova.results[["Levene\'s Test for Homogeneity of Variance"]][["p"]]');
  echo('))\n}\n');
  // Pairwise means comparison
  if (pairwiseMeans) {
    echo('rk.header(' + i18n("Pairwise comparison of means") + ', level=3)\n');
    if (design == 'between') {
      echo('for(i in 1:length(pairs)){\n');
      echo('\trk.header(paste(' + i18n("Confidence intervals for the difference of means according to") + ', names(pairs)[i]),level=4)\n');
      echo('rk.results(list(');
      echo(i18n("Pairs") + ' = rownames(pairs[[i]]), ');
      echo(i18n("Difference of means") + ' = pairs[[i]][,1], ');
      echo(i18n("Lower limit") + ' = pairs[[i]][,2], ');
      echo(i18n("Upper limit") + ' = pairs[[i]][,3], ');
      echo(i18n("p-value") + ' = pairs[[i]][,4]');
      echo('))\n');
      echo('}\n');
    } else {
      echo('rk.header(' + i18n("Tukey\'s test for pairwise comparison of means") + ', level=4)\n');
      echo('rk.results(list(');
      echo(i18n("Pairs") + ' = names(summary(pairs)$test$coefficients), ');
      echo(i18n("Estimate") + ' = summary(pairs)$test$coefficients, ');
      echo(i18n("Standard error") + ' = summary(pairs)$test$sigma, ');
      echo(i18n("t statistic") + ' = summary(pairs)$test$tstat, ');
      echo(i18n("p-value") + ' = summary(pairs)$test$pvalues');
      echo('))\n');
      echo('rk.header(' + i18n("Confidence intervals for the difference of means") + ', level=4)\n');
      echo('rk.results(list(');
      echo(i18n("Pairs") + ' = rownames(confint(pairs)$confint), ');
      echo(i18n("Estimate") + ' = confint(pairs)$confint[,1], ');
      echo(i18n("Lower limit") + ' = confint(pairs)$confint[,2], ');
      echo(i18n("Upper limit") + ' = confint(pairs)$confint[,3]');
      echo('))\n');
    }
  }
  // Pairwise means plot
  if (pairwisePlot) {
    echo('rk.header(' + i18n("Pairwise comparison of means plot") + ', level=4)\n');
    echo('rk.graph.on()\n');
    echo('par(mar=c(4,10,4,2))\n');
    echo('plot(pairs)\n');
    echo('rk.graph.off()\n');
  }
}
