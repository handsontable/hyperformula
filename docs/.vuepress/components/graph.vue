<template>
    <div>
        <div class="diagram" v-html="diagram"></div>
    </div>
</template>

<script>
  import HyperFormula from '../../../dist/hyperformula.full'
  import DiagramsBehavior from 'chevrotain/diagrams/src/diagrams_behavior'
  import DiagramsBuilder from 'chevrotain/diagrams/src/diagrams_builder'

  const hf = HyperFormula.buildEmpty();
  const grammar = hf.parser.getSerializedGastProductions();

  export default {
    data() {
      return {
        diagram: DiagramsBuilder.buildSyntaxDiagramsText(grammar)
      }
    },
    mounted() {
      DiagramsBehavior.initDiagramsBehavior()
    }
  }
</script>

<style src="chevrotain/diagrams/diagrams.css" ></style>
<style>
    svg {
        width: initial;
    }

    .diagram {
        text-align: center;
    }

    .diagram svg {
        width: 100%
    }
</style>
