import sys
import psycopg2

user_id = sys.argv[1]
conn = psycopg2.connect("postgresql://postgres:N2xdKW4qMCR5OUwD@db.llmcoxonpdoitwlrasvy.supabase.co:5432/postgres?sslmode=require")
cur = conn.cursor()
cur.execute("SELECT user_id, email, nombre FROM users WHERE user_id = %s", (user_id,))
row = cur.fetchone()
print(row)
cur.close()
conn.close()
