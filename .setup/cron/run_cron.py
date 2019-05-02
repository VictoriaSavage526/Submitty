#!/usr/bin/env python3

"""
Assigns Cron Jobs defined in cron tab file
"""

import json
import os
from crontab import CronTab

CRON_DIR = os.path.dirname(os.path.realpath(__file__))

#reads cron_tabs.json and assigns jobs
def assign_jobs():
    with open(os.path.join(CRON_DIR, 'cron_tabs.json')) as cron_file:
        cron_tabs = json.load(cron_file)
        for cron_user in cron_tabs:
            cron_string = ""
            for cron_job in cron_tabs[cron_user]:
                cron_string += (cron_job + "\n")

            new_job = CronTab(tab=cron_string)
            new_job.write_to_user(user=cron_user)



if __name__ == '__main__':
    try:
        assign_jobs()
    except Exception as e:
        print("Error Assigining Cron Jobs: " + str(e))
