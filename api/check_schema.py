import psycopg2

conn = psycopg2.connect("postgresql://postgres:N2xdKW4qMCR5OUwD@db.llmcoxonpdoitwlrasvy.supabase.co:5432/postgres?sslmode=require")
cur = conn.cursor()
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'")
rows = cur.fetchall()
for row in rows:
    print(row)
cur.close()
conn.close()
