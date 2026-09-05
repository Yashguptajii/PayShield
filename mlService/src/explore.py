import pandas as pd

df=pd.read_csv("data/creditcard.csv")

print("\nShape")
print(df.shape)

print("\nColumns:")
print(df.columns.tolist())
print("\nFirst 5 rows:")
print(df.head())
print("\nData Types:")
print(df.dtypes)
print("\nMissing values:")
print(df.isnull().sum().sum())
print("\nClass distribution:")
print(df["Class"].value_counts())
print("\nCkass percentage:")
print(df["Class"].value_counts(normalize=True)*100)
print("\nAmount statistics:")
print(df["Amount"].describe())