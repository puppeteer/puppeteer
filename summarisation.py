from transformers import pipeline

summarizer = pipeline("summarization", 
                      model="t5-base", 
                      tokenizer="t5-base", 
                      framework="tf",
                      device=0)

ARTICLE = "your article text goes here"

summarized_text = summarizer(ARTICLE, 
                             max_length=130, 
                             min_length=30, 
                             do_sample=False)

print(summarized_text[0]['summary_text'])
