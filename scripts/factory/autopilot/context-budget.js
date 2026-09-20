// CLI event payloads are bytes, not tokenizer counts. Keep these guards explicitly separate.
function exceeded({observedBytes,outputBytes,itemBytes,budget}){
  const maxObserved=budget.maxObservedContextBytes || 400000;
  const maxItem=budget.maxToolOutputBytes || 64000;
  return itemBytes>maxItem || observedBytes>maxObserved || outputBytes>budget.remainingOutputTokens*4;
}
module.exports={exceeded};
